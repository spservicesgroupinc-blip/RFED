
/**
 * RFE BACKEND - SERVICE A: AUTHENTICATION
 * Handles: Login, Signup, Crew Login, Master DB Management
 */

const CONSTANTS = {
    ROOT_FOLDER_NAME: "RFE App Data",
    MASTER_DB_NAME: "RFE Master Login DB"
};

// --- SECURITY & UTILS ---

// Set this in Project Settings > Script Properties
const getSecret = () => PropertiesService.getScriptProperties().getProperty("SECRET_SALT") || "dev_fallback_salt_change_me";

function generateToken(username, role, companyId) {
    const expiry = new Date().getTime() + (1000 * 60 * 60 * 24 * 7); // 7 Days
    // We embed companyId (SpreadsheetID) into the token for extra validation later
    const data = `${username}:${role}:${companyId}:${expiry}`;
    const signature = Utilities.base64Encode(Utilities.computeHmacSignature(Utilities.MacAlgorithm.HMAC_SHA_256, data, getSecret()));
    return Utilities.base64Encode(`${data}::${signature}`);
}

function hashPassword(p) { 
    return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, p + getSecret())); 
}

function sendResponse(status, data) {
    return ContentService.createTextOutput(JSON.stringify({ 
        status, 
        [status === 'success' ? 'data' : 'message']: data 
    })).setMimeType(ContentService.MimeType.JSON);
}

// --- API GATEWAY ---

function doPost(e) {
    try {
        if (!e?.postData) throw new Error("No payload.");
        const req = JSON.parse(e.postData.contents);
        const { action, payload } = req;
        
        let result;

        switch (action) {
            case 'LOGIN': result = handleLogin(payload); break;
            case 'SIGNUP': result = handleSignup(payload); break;
            case 'CREW_LOGIN': result = handleCrewLogin(payload); break;
            case 'UPDATE_PASSWORD': result = handleUpdatePassword(payload); break;
            case 'SUBMIT_TRIAL': result = handleSubmitTrial(payload); break;
            default: throw new Error(`Unknown Auth Action: ${action}`);
        }
        
        return sendResponse('success', result);

    } catch (error) {
        console.error("Auth Error", error);
        return sendResponse('error', error.toString());
    }
}

// --- CORE FUNCTIONS ---

function handleLogin(p) {
    const ss = getMasterSpreadsheet();
    const sh = ss.getSheetByName("Users_DB");
    
    // Using TextFinder for speed on larger datasets
    const f = sh.getRange("A:A").createTextFinder(p.username.trim()).matchEntireCell(true).findNext();
    
    if (!f) throw new Error("User not found.");
    
    const row = f.getRow();
    // [Username, PasswordHash, CompanyName, SpreadsheetID, FolderID, CreatedAt, CrewCode, Email]
    const userData = sh.getRange(row, 1, 1, 8).getValues()[0];
    
    if (String(userData[1]) !== hashPassword(p.password)) throw new Error("Incorrect password.");

    return { 
        username: userData[0], 
        companyName: userData[2], 
        spreadsheetId: userData[3], 
        folderId: userData[4], 
        role: 'admin', 
        token: generateToken(userData[0], 'admin', userData[3]) 
    };
}

function handleSignup(p) {
    const ss = getMasterSpreadsheet();
    const sh = ss.getSheetByName("Users_DB");
    
    // Check Duplicate
    const existing = sh.getRange("A:A").createTextFinder(p.username.trim()).matchEntireCell(true).findNext();
    if (existing) throw new Error("Username already taken.");

    // Transaction-like creation
    const crewPin = Math.floor(1000 + Math.random() * 9000).toString();
    let resources;

    try {
        resources = createCompanyResources(p.companyName, p.username, crewPin, p.email);
    } catch (e) {
        throw new Error("Failed to provision drive resources. Please try again.");
    }

    sh.appendRow([
        p.username.trim(), 
        hashPassword(p.password), 
        p.companyName, 
        resources.ssId, 
        resources.folderId, 
        new Date(), 
        crewPin, 
        p.email
    ]);

    return { 
        username: p.username, 
        companyName: p.companyName, 
        spreadsheetId: resources.ssId, 
        folderId: resources.folderId, 
        role: 'admin', 
        token: generateToken(p.username, 'admin', resources.ssId), 
        crewPin 
    };
}

function handleCrewLogin(p) {
    const ss = getMasterSpreadsheet();
    const sh = ss.getSheetByName("Users_DB");
    
    const f = sh.getRange("A:A").createTextFinder(p.username.trim()).matchEntireCell(true).findNext();
    if (!f) throw new Error("Company ID not found.");
    
    const rowData = sh.getRange(f.getRow(), 1, 1, 8).getValues()[0];
    
    // Col index 6 is CrewCode (7th column)
    if (String(rowData[6]).trim() !== String(p.pin).trim()) throw new Error("Invalid Crew PIN.");

    return { 
        username: rowData[0],
        companyName: rowData[2], 
        spreadsheetId: rowData[3], 
        folderId: rowData[4], 
        role: 'crew', 
        token: generateToken(rowData[0], 'crew', rowData[3]) 
    };
}

function handleUpdatePassword(p) {
    const ss = getMasterSpreadsheet();
    const sh = ss.getSheetByName("Users_DB");
    const f = sh.getRange("A:A").createTextFinder(p.username.trim()).matchEntireCell(true).findNext();
    if (!f) throw new Error("User not found.");
    
    const r = f.getRow();
    const currentHash = sh.getRange(r, 2).getValue();
    
    if (String(currentHash) !== hashPassword(p.currentPassword)) throw new Error("Incorrect current password.");
    
    sh.getRange(r, 2).setValue(hashPassword(p.newPassword));
    return { success: true };
}

function handleSubmitTrial(p) { 
    getMasterSpreadsheet().getSheetByName("Trial_Memberships").appendRow([p.name, p.email, p.phone, new Date()]); 
    return { success: true }; 
}

// --- HELPER INFRASTRUCTURE ---

function getRootFolder() {
    const folders = DriveApp.getFoldersByName(CONSTANTS.ROOT_FOLDER_NAME);
    if (folders.hasNext()) return folders.next();
    return DriveApp.createFolder(CONSTANTS.ROOT_FOLDER_NAME);
}

function getMasterSpreadsheet() {
    const root = getRootFolder();
    const files = root.getFilesByName(CONSTANTS.MASTER_DB_NAME);
    if (files.hasNext()) return SpreadsheetApp.open(files.next());
    
    const ss = SpreadsheetApp.create(CONSTANTS.MASTER_DB_NAME);
    DriveApp.getFileById(ss.getId()).moveTo(root);
    
    let s = ss.getSheetByName("Users_DB");
    if (!s) {
        s = ss.insertSheet("Users_DB");
        s.appendRow(["Username", "PasswordHash", "CompanyName", "SpreadsheetID", "FolderID", "CreatedAt", "CrewCode", "Email"]);
        s.setFrozenRows(1);
    }
    
    let t = ss.getSheetByName("Trial_Memberships");
    if (!t) {
        t = ss.insertSheet("Trial_Memberships");
        t.appendRow(["Name", "Email", "Phone", "Timestamp"]);
    }
    return ss;
}

function createCompanyResources(companyName, username, crewPin, email) {
    const root = getRootFolder();
    const safeName = companyName.replace(/[^a-zA-Z0-9 ]/g, "").trim();
    const companyFolder = root.createFolder(`${safeName} Data`);
    
    const ss = SpreadsheetApp.create(`${companyName} - Master Data`);
    DriveApp.getFileById(ss.getId()).moveTo(companyFolder);
    
    const initialProfile = { 
        companyName, crewAccessPin: crewPin, email: email || "", 
        logoUrl: "", phone: "", addressLine1: "" 
    };

    const setSheet = ss.insertSheet("Settings_DB");
    setSheet.appendRow(["Config_Key", "JSON_Value"]);
    setSheet.appendRow(['companyProfile', JSON.stringify(initialProfile)]);
    setSheet.appendRow(['costs', JSON.stringify({ openCell: 2000, closedCell: 2600, laborRate: 85 })]);
    
    // Cleanup default sheet
    const s1 = ss.getSheetByName("Sheet1");
    if (s1) ss.deleteSheet(s1);

    return { ssId: ss.getId(), folderId: companyFolder.getId() };
}
