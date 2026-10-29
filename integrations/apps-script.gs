// Deploy as a new Apps Script Web App. Set LSC_SECRET and LSC_SPREADSHEET_ID
// in Script Properties. Only the server knows the secret; never put it in HTML.
function doPost(e) {
  const reply = value => ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
  const props = PropertiesService.getScriptProperties();
  const secret = props.getProperty('LSC_SECRET');
  let lock;
  try {
    const body = JSON.parse(e.postData.contents);
    if (!secret || secret.length < 32 || typeof body.payload !== 'string' || body.payload.length > 20000 || !Number.isInteger(body.timestamp) || Math.abs(Date.now()/1000-body.timestamp)>300) return reply({success:false});
    const expected=Utilities.computeHmacSha256Signature(body.timestamp+'.'+body.payload,secret).map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join('');
    if (typeof body.signature!=='string'||body.signature.length!==expected.length) return reply({success:false});
    let diff=0;for(let i=0;i<expected.length;i++)diff|=expected.charCodeAt(i)^body.signature.charCodeAt(i);if(diff)return reply({success:false});
    const lead=JSON.parse(body.payload);if(!/^LSC-[A-F0-9]{16}$/.test(lead.id))return reply({success:false});
    lock=LockService.getScriptLock();lock.waitLock(10000);
    const book=SpreadsheetApp.openById(props.getProperty('LSC_SPREADSHEET_ID'));
    const sheet=book.getSheetByName('LSC Requests')||book.insertSheet('LSC Requests');
    if(sheet.getLastRow()===0)sheet.appendRow(['ID','Created UTC','Name','Phone','Building type','Message','Quote','Language','Source','Status']);
    if(sheet.getLastRow()>1 && sheet.getRange(2,1,sheet.getLastRow()-1,1).createTextFinder(lead.id).matchEntireCell(true).findNext())return reply({success:true,id:lead.id});
    const safe=value=>"'"+String(value??''); // Prevent spreadsheet formula interpretation.
    const p=lead.data;
    sheet.appendRow([lead.id,new Date(lead.created_at*1000).toISOString(),safe(p.name),safe(p.phone),safe(p.type),safe(p.message),safe(JSON.stringify(p.quote)),safe(p.language),safe(p.source),'new']);
    SpreadsheetApp.flush();return reply({success:true,id:lead.id});
  }catch(error){return reply({success:false});}finally{if(lock)lock.releaseLock();}
}
