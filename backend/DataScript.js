
/**
 * RFE BACKEND - SERVICE B: DATA & OPERATIONS
 * Handles: Sync, Jobs, Inventory, Financials, Files
 */

// --- 1. CONFIG ---

const COL_MAPS = {
    ESTIMATES: { ID: 0, DATE: 1, CUSTOMER: 2, VALUE: 3, STATUS: 4, INVOICE: 5, COST: 6, PDF: 7, JSON: 8 },
    CUSTOMERS: { ID: 0, NAME: 1, ADDR: 2, CITY: 3, STATE: 4, ZIP: 5, PHONE: 6, EMAIL: 7, STATUS: 8, JSON: 9 },
    INVENTORY: { ID: 0, NAME: 1, QTY: 2, UNIT: 3, COST: 4, JSON: 5 },
    EQUIPMENT: { ID: 0, NAME: 1, STATUS: 2, JSON: 3 }
};

const TAB_NAMES = {
    EST: "Estimates_DB",
    CUST: "Customers_DB",
    INV: "Inventory_DB",
    EQ: "Equipment_DB",
    SET: "Settings_DB",
    PNL: "Profit_Loss_DB",
    LOG: "Material_Log_DB"
};

const safeParse = (str) => { try { return str ? JSON.parse(str) : null; } catch (e) { return null; } };

// Fetch secret (Must match Script 1)
const getSecret = () => PropertiesService.getScriptProperties().getProperty("SECRET_SALT") || "dev_fallback_salt_change_me";

// --- 2. SECURITY ---

function validateToken(token, requestedSheetId) {
    if (!token) throw new Error("Unauthorized: No token");
    try {
        const decoded = Utilities.newBlob(Utilities.base64Decode(token)).getDataAsString();
        const parts = decoded.split("::");
        if (parts.length !== 2) throw new Error("Invalid token format");
        
        const [data, signature] = parts;
        const expectedSig = Utilities.base64Encode(Utilities.computeHmacSignature(Utilities.MacAlgorithm.HMAC_SHA_256, data, getSecret()));
        
        if (signature !== expectedSig) throw new Error("Invalid token signature");
        
        const [user, role, companyId, expiry] = data.split(":");
        
        if (new Date().getTime() > parseInt(expiry)) throw new Error("Token expired");
        
        // Security Binding: Ensure token was issued for the Sheet being accessed
        if (companyId && requestedSheetId && companyId !== requestedSheetId) {
            throw new Error("Token mismatch for this company.");
        }
        
        return { username: user, role: role };
    } catch (e) { 
        throw new Error("Authorization Failed: " + e.message); 
    }
}

// --- 3. API GATEWAY ---

function doPost(e) {
    let lock;
    try {
        if (!e?.postData) throw new Error("No payload.");
        const req = JSON.parse(e.postData.contents);
        const { action, payload } = req;
        
        if (!payload.spreadsheetId) throw new Error("Missing Spreadsheet ID");
        
        // 1. Validate Token FIRST (No Lock needed for this)
        validateToken(payload.token, payload.spreadsheetId);
        
        // 2. Open Sheet (Lazy Load)
        const userSS = SpreadsheetApp.openById(payload.spreadsheetId);

        // 3. Acquire Lock (Only for Write operations to improve concurrency)
        const READ_ONLY_ACTIONS = ['SYNC_DOWN']; 
        
        if (!READ_ONLY_ACTIONS.includes(action)) {
            lock = LockService.getScriptLock();
            // Faster failure: 10s wait. If locked, client should retry.
            if (!lock.tryLock(10000)) return sendResponse('error', 'Database is busy. Retry in 5s.');
        }

        let result;
        switch (action) {
            case 'SYNC_DOWN': result = handleSyncDown(userSS, payload.lastSyncTimestamp); break;
            case 'SYNC_UP': result = handleSyncUp(userSS, payload); break;
            case 'START_JOB': result = handleStartJob(userSS, payload); break;
            case 'COMPLETE_JOB': result = handleCompleteJob(userSS, payload); break;
            case 'MARK_JOB_PAID': result = handleMarkJobPaid(userSS, payload); break;
            case 'DELETE_ESTIMATE': result = handleDeleteEstimate(userSS, payload); break;
            case 'SAVE_PDF': result = handleSavePdf(userSS, payload); break;
            case 'UPLOAD_IMAGE': result = handleUploadImage(userSS, payload); break;
            case 'CREATE_WORK_ORDER': result = handleCreateWorkOrder(userSS, payload); break;
            case 'LOG_TIME': result = handleLogTime(payload); break;
            default: throw new Error(`Unknown Action: ${action}`);
        }

        return sendResponse('success', result);

    } catch (error) {
        console.error("API Error", error);
        return sendResponse('error', error.message || error.toString());
    } finally { 
        if (lock) lock.releaseLock(); 
    }
}

function sendResponse(status, data) {
    return ContentService.createTextOutput(JSON.stringify({ 
        status, 
        [status === 'success' ? 'data' : 'message']: data 
    })).setMimeType(ContentService.MimeType.JSON);
}

// --- 4. BUSINESS LOGIC ---

function handleSyncDown(ss, lastSyncTimestamp = 0) {
    // Helper: Returns rows modified > timestamp
    const getChanged = (sheetName, jsonColIdx) => {
        const s = ss.getSheetByName(sheetName);
        if (!s || s.getLastRow() <= 1) return [];
        const vals = s.getRange(2, jsonColIdx + 1, s.getLastRow() - 1, 1).getValues();
        return vals.map(r => safeParse(r[0])).filter(item => {
            if (!item) return false;
            // Sync if new (no Modified date) or if newer than client timestamp
            const mod = item.lastModified ? new Date(item.lastModified).getTime() : 0;
            return mod > lastSyncTimestamp || mod === 0;
        });
    };

    setupSchemaIfNeeded(ss);

    // Fetch settings (always fetch all, small dataset)
    const settings = {};
    const sSheet = ss.getSheetByName(TAB_NAMES.SET);
    if (sSheet && sSheet.getLastRow() > 1) {
        sSheet.getDataRange().getValues().forEach(r => { if (r[0]) settings[r[0]] = safeParse(r[1]); });
    }
    
    // Fetch Material Logs specifically (No JSON col, raw read)
    const materialLogs = [];
    const logSheet = ss.getSheetByName(TAB_NAMES.LOG);
    if (logSheet && logSheet.getLastRow() > 1) {
        // Read raw values: Date, JobId, Cust, Item, Qty, Unit, User
        const rawLogs = logSheet.getRange(2, 1, logSheet.getLastRow() - 1, 7).getValues();
        rawLogs.forEach((r, idx) => {
            if (r[0]) {
                materialLogs.push({
                    id: `${r[1]}-${idx}`, // Composite ID
                    date: r[0], // Date string or object
                    jobId: r[1],
                    customerName: r[2],
                    materialName: r[3],
                    quantity: Number(r[4]),
                    unit: r[5],
                    loggedBy: r[6]
                });
            }
        });
    }
    
    // Construct Warehouse object
    const whCounts = settings['warehouse_counts'] || {};
    const warehouse = {
        openCellSets: whCounts.openCellSets || 0,
        closedCellSets: whCounts.closedCellSets || 0,
        items: getChanged(TAB_NAMES.INV, COL_MAPS.INVENTORY.JSON)
    };

    return {
        ...settings,
        warehouse,
        materialLogs, // NEW: Include the logs in the sync payload
        lifetimeUsage: settings['lifetime_usage'] || { openCell: 0, closedCell: 0 },
        equipment: getChanged(TAB_NAMES.EQ, COL_MAPS.EQUIPMENT.JSON),
        savedEstimates: getChanged(TAB_NAMES.EST, COL_MAPS.ESTIMATES.JSON),
        customers: getChanged(TAB_NAMES.CUST, COL_MAPS.CUSTOMERS.JSON),
        serverTimestamp: new Date().getTime()
    };
}

function handleSyncUp(ss, payload) {
    const { state } = payload;
    
    // 1. Settings
    const sSheet = ss.getSheetByName(TAB_NAMES.SET);
    const setMap = new Map();
    if (sSheet.getLastRow() > 1) sSheet.getDataRange().getValues().forEach(r => setMap.set(r[0], r[1]));

    const updateSet = (k, v) => v !== undefined && setMap.set(k, JSON.stringify(v));
    
    ['companyProfile', 'yields', 'costs', 'expenses', 'jobNotes', 'sqFtRates', 'pricingMode', 'purchaseOrders'].forEach(k => updateSet(k, state[k]));
    
    if (state.warehouse) {
        setMap.set('warehouse_counts', JSON.stringify({ 
            openCellSets: state.warehouse.openCellSets, 
            closedCellSets: state.warehouse.closedCellSets 
        }));
    }

    const out = Array.from(setMap.entries()).filter(k => k[0] !== 'Config_Key');
    sSheet.getRange(2, 1, sSheet.getLastRow(), 2).clearContent();
    if(out.length) sSheet.getRange(2, 1, out.length, 2).setValues(out);

    // 2. Data Tables (Optimized Batch Writes)
    if (state.warehouse?.items) updateSheet(ss, TAB_NAMES.INV, state.warehouse.items, COL_MAPS.INVENTORY, i => [i.id, i.name, i.quantity, i.unit, i.unitCost, JSON.stringify(i)]);
    if (state.equipment) updateSheet(ss, TAB_NAMES.EQ, state.equipment, COL_MAPS.EQUIPMENT, i => [i.id, i.name, i.status, JSON.stringify(i)]);
    if (state.customers) updateSheet(ss, TAB_NAMES.CUST, state.customers, COL_MAPS.CUSTOMERS, c => [c.id, c.name, c.address, c.city, c.state, c.zip, c.phone, c.email, c.status, JSON.stringify(c)]);
    if (state.savedEstimates) syncEstimates(ss, state.savedEstimates);

    return { synced: true };
}

function handleCompleteJob(ss, payload) {
    const { estimateId, actuals } = payload;
    const estSheet = ss.getSheetByName(TAB_NAMES.EST);
    
    // 1. Find Estimate (Optimized to stop early)
    const finder = estSheet.getRange(2, 1, estSheet.getLastRow(), 1).createTextFinder(estimateId).matchEntireCell(true).findNext();
    if (!finder) throw new Error("Estimate not found");
    
    const rowIdx = finder.getRow();
    const estJson = estSheet.getRange(rowIdx, COL_MAPS.ESTIMATES.JSON + 1).getValue();
    const est = safeParse(estJson);

    if (est.executionStatus === 'Completed' && est.inventoryProcessed) {
        return { success: true, message: "Job already finalized." };
    }

    // 2. Calculate Inventory Changes
    const setSheet = ss.getSheetByName(TAB_NAMES.SET);
    const setsData = setSheet.getDataRange().getValues();
    let counts = { openCellSets: 0, closedCellSets: 0 };
    let lifetime = { openCell: 0, closedCell: 0 };
    let rCounts = -1, rLife = -1;

    setsData.forEach((r, i) => {
        if(r[0] === 'warehouse_counts') { counts = safeParse(r[1]) || counts; rCounts = i+1; }
        if(r[0] === 'lifetime_usage') { lifetime = safeParse(r[1]) || lifetime; rLife = i+1; }
    });

    const actOc = Number(actuals.openCellSets || 0);
    const actCc = Number(actuals.closedCellSets || 0);
    
    const estOc = Number(est.materials?.openCellSets || 0);
    const estCc = Number(est.materials?.closedCellSets || 0);
    
    const diffOc = actOc - estOc;
    const diffCc = actCc - estCc;

    counts.openCellSets = Math.max(0, (counts.openCellSets || 0) - diffOc);
    counts.closedCellSets = Math.max(0, (counts.closedCellSets || 0) - diffCc);
    
    lifetime.openCell = (lifetime.openCell || 0) + actOc;
    lifetime.closedCell = (lifetime.closedCell || 0) + actCc;

    // Update Settings
    if(rCounts > 0) setSheet.getRange(rCounts, 2).setValue(JSON.stringify(counts));
    if(rLife > 0) setSheet.getRange(rLife, 2).setValue(JSON.stringify(lifetime));

    // 3. Update Individual Inventory Items
    if(actuals.inventory && actuals.inventory.length) {
        const invSheet = ss.getSheetByName(TAB_NAMES.INV);
        const data = invSheet.getDataRange().getValues();
        const itemMap = new Map();
        for(let i=1; i<data.length; i++) itemMap.set(data[i][0], i+1);

        actuals.inventory.forEach(item => {
            if(itemMap.has(item.id)) {
                const r = itemMap.get(item.id);
                const cur = safeParse(data[r-1][COL_MAPS.INVENTORY.JSON]);
                if(cur) {
                    const estItem = (est.materials?.inventory || []).find(i => i.id === item.id);
                    const estQty = Number(estItem?.quantity || 0);
                    const actQty = Number(item.quantity || 0);
                    const diffQty = actQty - estQty;
                    
                    cur.quantity = (cur.quantity || 0) - diffQty;
                    invSheet.getRange(r, COL_MAPS.INVENTORY.QTY+1).setValue(cur.quantity);
                    invSheet.getRange(r, COL_MAPS.INVENTORY.JSON+1).setValue(JSON.stringify(cur));
                }
            }
        });
    }

    // 4. Update Estimate Status
    est.executionStatus = 'Completed';
    est.actuals = actuals;
    est.inventoryProcessed = true;
    est.lastModified = new Date().toISOString();
    estSheet.getRange(rowIdx, COL_MAPS.ESTIMATES.JSON + 1).setValue(JSON.stringify(est));

    // 5. Append Log
    const logSheet = ss.getSheetByName(TAB_NAMES.LOG);
    const date = actuals.completionDate || new Date().toISOString();
    const rows = [
        ["Open Cell", actOc, "Sets"], 
        ["Closed Cell", actCc, "Sets"], 
        ...(actuals.inventory || []).map(i => [i.name, i.quantity, i.unit])
    ].filter(r => r[1] > 0).map(r => [
        date, estimateId, est.customer?.name, r[0], r[1], r[2], actuals.completedBy || "Crew", "{}"
    ]);
    
    if(rows.length) logSheet.getRange(logSheet.getLastRow()+1, 1, rows.length, rows[0].length).setValues(rows);

    SpreadsheetApp.flush();
    return { success: true };
}

// --- 5. HELPERS & STUBS FILLED ---

function updateSheet(ss, tabName, items, map, rowFn) {
    if (!items || !items.length) return;
    const sheet = ss.getSheetByName(tabName);
    if(sheet.getLastRow() > 1) sheet.getRange(2, 1, sheet.getLastRow()-1, sheet.getLastColumn()).clearContent();
    const rows = items.map(rowFn);
    sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

function syncEstimates(ss, incoming) {
    const sheet = ss.getSheetByName(TAB_NAMES.EST);
    const dbMap = new Map();
    const data = sheet.getDataRange().getValues();
    
    for(let i=1; i<data.length; i++) {
        const obj = safeParse(data[i][COL_MAPS.ESTIMATES.JSON]);
        if(obj?.id) dbMap.set(obj.id, obj);
    }

    incoming.forEach(inc => {
        const exist = dbMap.get(inc.id);
        if(exist) {
            if (exist.executionStatus === 'Completed') {
                inc.executionStatus = 'Completed';
                inc.actuals = exist.actuals;
            }
            if (exist.status === 'Paid') inc.status = 'Paid';
            if (exist.pdfLink && !inc.pdfLink) inc.pdfLink = exist.pdfLink;
            if (exist.workOrderSheetUrl) inc.workOrderSheetUrl = exist.workOrderSheetUrl;
        }
        dbMap.set(inc.id, inc);
    });

    updateSheet(ss, TAB_NAMES.EST, Array.from(dbMap.values()), COL_MAPS.ESTIMATES, e => [
        e.id, e.date, e.customer?.name, e.totalValue, e.status, e.invoiceNumber, e.results?.materialCost, e.pdfLink, JSON.stringify(e)
    ]);
}

function setupSchemaIfNeeded(ss) {
    const ensure = (n, h) => {
        if(!ss.getSheetByName(n)) {
            const s = ss.insertSheet(n); s.appendRow(h); s.setFrozenRows(1);
        }
    };
    ensure(TAB_NAMES.CUST, ["ID", "Name", "Address", "City", "State", "Zip", "Phone", "Email", "Status", "JSON"]);
    ensure(TAB_NAMES.EST, ["ID", "Date", "Customer", "Value", "Status", "Inv #", "Cost", "PDF", "JSON"]);
    ensure(TAB_NAMES.INV, ["ID", "Name", "Qty", "Unit", "Cost", "JSON"]);
    ensure(TAB_NAMES.EQ, ["ID", "Name", "Status", "JSON"]);
    ensure(TAB_NAMES.LOG, ["Date", "JobId", "Cust", "Item", "Qty", "Unit", "User", "JSON"]);
    ensure(TAB_NAMES.PNL, ["Date", "JobId", "Cust", "Inv", "Rev", "Chem", "Lab", "InvCost", "Misc", "COGS", "Profit", "Margin"]);
}

function handleMarkJobPaid(ss, payload) {
   const sheet = ss.getSheetByName(TAB_NAMES.EST);
   const finder = sheet.getRange("A:A").createTextFinder(payload.estimateId).matchEntireCell(true).findNext();
   if(!finder) throw new Error("Estimate not found");
   
   const r = finder.getRow();
   const est = safeParse(sheet.getRange(r, COL_MAPS.ESTIMATES.JSON+1).getValue());
   
   if (!est) throw new Error("Invalid Estimate Data");

   est.status = 'Paid';
   est.lastModified = new Date().toISOString();
   
   // Calc Financials (Simplified for brevity, assumes logic exists on frontend/backend match)
   const revenue = Number(est.totalValue) || 0;
   const costs = Number(est.results?.totalCost) || 0; // Simplified
   
   sheet.getRange(r, COL_MAPS.ESTIMATES.STATUS+1).setValue('Paid');
   sheet.getRange(r, COL_MAPS.ESTIMATES.JSON+1).setValue(JSON.stringify(est));
   
   // Add to P&L
   const pnl = ss.getSheetByName(TAB_NAMES.PNL);
   pnl.appendRow([new Date(), est.id, est.customer?.name, est.invoiceNumber, revenue, 0, 0, 0, 0, costs, revenue-costs, 0]); 
   
   return { success: true, estimate: est };
}

function handleStartJob(ss, p) {
    const s = ss.getSheetByName(TAB_NAMES.EST);
    const f = s.getRange("A:A").createTextFinder(p.estimateId).findNext();
    if(!f) throw new Error("Not found");
    const r = f.getRow();
    const est = safeParse(s.getRange(r, COL_MAPS.ESTIMATES.JSON+1).getValue());
    est.executionStatus = 'In Progress';
    est.lastModified = new Date().toISOString();
    s.getRange(r, COL_MAPS.ESTIMATES.JSON+1).setValue(JSON.stringify(est));
    return { success: true };
}

function handleDeleteEstimate(ss, p) {
    const s = ss.getSheetByName(TAB_NAMES.EST);
    const f = s.getRange("A:A").createTextFinder(p.estimateId).findNext();
    if(f) s.deleteRow(f.getRow());
    return { success: true };
}

function handleSavePdf(ss, p) {
    const parentFolder = p.folderId ? DriveApp.getFolderById(p.folderId) : DriveApp.getRootFolder();
    const blob = Utilities.newBlob(Utilities.base64Decode(p.base64Data.split(',')[1]), MimeType.PDF, p.fileName);
    const file = parentFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Auto-attach
    if (p.estimateId) {
        const s = ss.getSheetByName(TAB_NAMES.EST);
        const f = s.getRange("A:A").createTextFinder(p.estimateId).matchEntireCell(true).findNext();
        if(f) {
            const r = f.getRow();
            const j = safeParse(s.getRange(r, COL_MAPS.ESTIMATES.JSON + 1).getValue());
            if(j) {
                j.pdfLink = file.getUrl();
                s.getRange(r, COL_MAPS.ESTIMATES.PDF + 1).setValue(file.getUrl());
                s.getRange(r, COL_MAPS.ESTIMATES.JSON + 1).setValue(JSON.stringify(j));
            }
        }
    }
    return { success: true, url: file.getUrl() };
}

function handleUploadImage(ss, p) {
    const { base64Data, fileName } = p;
    // Try finding "Job Photos"
    let targetFolder;
    try { targetFolder = DriveApp.getFileById(ss.getId()).getParents().next().getFoldersByName("Job Photos").next(); } 
    catch(e) { targetFolder = DriveApp.getRootFolder(); } // Fallback

    const encoded = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    const blob = Utilities.newBlob(Utilities.base64Decode(encoded), MimeType.JPEG, fileName || "photo.jpg");
    const file = targetFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return { url: `https://drive.google.com/thumbnail?id=${file.getId()}&sz=w1000`, fileId: file.getId() };
}

function handleCreateWorkOrder(ss, p) {
    let parentFolder;
    try { parentFolder = p.folderId ? DriveApp.getFolderById(p.folderId) : DriveApp.getRootFolder(); } catch (e) { parentFolder = DriveApp.getRootFolder(); }
    
    const est = p.estimateData;
    const safeName = est.customer?.name ? est.customer.name.replace(/[^a-zA-Z0-9 ]/g, "") : "Unknown";
    const name = `WO-${est.id.slice(0, 8).toUpperCase()} - ${safeName}`;
    const newSheet = SpreadsheetApp.create(name);
    
    try { DriveApp.getFileById(newSheet.getId()).moveTo(parentFolder); } catch (e) { }

    const infoSheet = newSheet.getSheetByName("Sheet1") || newSheet.insertSheet("Job Details");
    infoSheet.setName("Job Details");

    const addKV = (r, k, v) => {
        infoSheet.getRange(r, 1).setValue(k).setFontWeight("bold");
        infoSheet.getRange(r, 2).setValue(v);
    };

    infoSheet.getRange("A1").setValue("JOB SHEET").setFontSize(14).setFontWeight("bold").setBackground("#E30613").setFontColor("white");
    
    addKV(3, "Customer", est.customer?.name);
    addKV(4, "Address", `${est.customer?.address || ""} ${est.customer?.city || ""}`);
    
    let r = 6;
    if(est.materials?.openCellSets) { addKV(r++, "Open Cell Sets", Number(est.materials.openCellSets).toFixed(1)); }
    if(est.materials?.closedCellSets) { addKV(r++, "Closed Cell Sets", Number(est.materials.closedCellSets).toFixed(1)); }
    
    if(est.materials?.inventory) {
        r++; infoSheet.getRange(r++, 1).setValue("ADDITIONAL ITEMS").setFontWeight("bold");
        est.materials.inventory.forEach(i => addKV(r++, i.name, `${i.quantity} ${i.unit}`));
    }

    r++; infoSheet.getRange(r++, 1).setValue("NOTES").setFontWeight("bold");
    infoSheet.getRange(r, 1).setValue(est.notes || "No notes.");
    
    const logTab = newSheet.insertSheet("Daily Crew Log");
    logTab.appendRow(["Date", "Tech Name", "Start", "End", "Duration", "Sets Used", "Notes"]);
    logTab.setFrozenRows(1);

    return { url: newSheet.getUrl() };
}

function handleLogTime(p) {
    const ss = SpreadsheetApp.openByUrl(p.workOrderUrl); 
    const s = ss.getSheetByName("Daily Crew Log"); 
    s.appendRow([
        new Date().toLocaleDateString(), 
        p.user, 
        p.startTime, 
        p.endTime || "", 
        "", 
        "", 
        ""
    ]); 
    return { success: true }; 
}
