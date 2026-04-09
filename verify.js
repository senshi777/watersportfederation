// WSF Certificate Verification - standalone
(function() {

var SUPABASE_URL = "https://dxygivvyfwzsrexbtbnc.supabase.co";
var SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4eWdpdnZ5Znd6c3JleGJ0Ym5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NTA2MjIsImV4cCI6MjA5MTIyNjYyMn0.Ly-k3BUqiJTq-WeZ6m2rL64Ay8jucnzBRjxodm1merQ";

var database = {
  "WSF-MIT-2026-001": {
    name: "Bilal Jafar",
    rank: "Master Instructor Trainer",
    specialty: "Infant Aquatics (Train-the-Trainer)",
    status: "Active / Authorized",
    issued: "01 January 2026",
    expires: "31 December 2026",
    trainer: "WSF Governing Board"
  }
};

function getDb() {
  if (window.supabase) return window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  return null;
}

function showSuccess(record, id, resultBox) {
  resultBox.innerHTML = '<div class="verify-card" id="verifyCardEl">' +
    '<div style="display:flex;align-items:center;gap:.5rem;margin-bottom:1.2rem;">' +
    '<span style="color:#4ade80;font-size:1.2rem;">&#10003;</span>' +
    '<span style="font-family:Barlow Condensed,sans-serif;font-size:.8rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#4ade80;">Certificate Valid</span>' +
    '</div>' +
    '<div class="field"><span class="field-key">Holder</span><span class="field-val">' + record.name + '</span></div>' +
    '<div class="field"><span class="field-key">Rank</span><span class="field-val">' + record.rank + '</span></div>' +
    '<div class="field"><span class="field-key">Specialty</span><span class="field-val">' + record.specialty + '</span></div>' +
    '<div class="field"><span class="field-key">Status</span><span class="field-val" style="color:#4ade80;">' + record.status + '</span></div>' +
    '<div class="field"><span class="field-key">Issued By</span><span class="field-val">' + record.trainer + '</span></div>' +
    '<div class="field"><span class="field-key">Issue Date</span><span class="field-val">' + record.issued + '</span></div>' +
    '<div class="field"><span class="field-key">Expires</span><span class="field-val" style="color:#f59e0b;">' + record.expires + '</span></div>' +
    '<div class="field"><span class="field-key">Cert ID</span><span class="field-val" style="font-family:Barlow Condensed,sans-serif;letter-spacing:.05em;color:#8899aa;">' + id + '</span></div>' +
    '<div style="margin-top:1rem;padding-top:1rem;border-top:1px solid rgba(201,168,76,.2);">' +
    '<button id="verifyDLBtn" onclick="window.downloadVerifyPDF()" style="font-family:Barlow Condensed,sans-serif;font-size:.75rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;background:#c9a84c;color:#0a1628;border:none;padding:.6rem 1.5rem;cursor:pointer;width:100%;">Download PDF</button>' +
    '</div></div>';
  resultBox.style.display = 'block';
}

function showError(resultBox) {
  resultBox.innerHTML = '<div class="verify-card" style="border-color:rgba(239,68,68,.3);">' +
    '<div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.8rem;">' +
    '<span style="color:#f87171;font-size:1.2rem;">&#10005;</span>' +
    '<span style="font-family:Barlow Condensed,sans-serif;font-size:.8rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#f87171;">Record Not Found</span>' +
    '</div>' +
    '<p style="font-size:.82rem;color:#8899aa;line-height:1.6;">No certificate matching this ID was found. Please check the ID and try again.</p>' +
    '</div>';
  resultBox.style.display = 'block';
}

window.runVerification = async function() {
  var inputEl = document.getElementById('certInput');
  var resultBox = document.getElementById('verifyResult');
  if (!inputEl || !resultBox) return;
  var inputID = inputEl.value.trim().toUpperCase();
  if (!inputID) return;
  resultBox.innerHTML = '<div style="color:#8899aa;font-family:Barlow Condensed,sans-serif;font-size:.8rem;padding:.8rem 0">Checking WSF database...</div>';
  resultBox.style.display = 'block';
  // Hardcoded check
  if (database[inputID]) { showSuccess(database[inputID], inputID, resultBox); return; }
  // Supabase check
  try {
    var db = getDb();
    if (db) {
      var res = await db.from('members').select('*').eq('cert_id', inputID).single();
      if (res.data && !res.error) {
        var d = res.data;
        showSuccess({
          name: d.name,
          rank: d.level || d.specialty || '-',
          specialty: d.level || '',
          status: d.status === 'active' ? 'Active / Authorized' : d.status,
          issued: d.issued || '-',
          expires: d.expires || '-',
          trainer: d.trainer_name || 'WSF Accredited Trainer'
        }, inputID, resultBox);
        return;
      }
    }
  } catch(e) { console.warn('WSF verify error:', e); }
  showError(resultBox);
};

window.downloadVerifyPDF = async function() {
  var card = document.getElementById('verifyCardEl');
  if (!card) return;
  var btn = document.getElementById('verifyDLBtn');
  if (btn) { btn.textContent = 'Generating...'; btn.disabled = true; }
  try {
    var canvas = await html2canvas(card, {scale:3, backgroundColor:'#112240', logging:false});
    var img = canvas.toDataURL('image/jpeg', 0.95);
    var pdf = new jspdf.jsPDF({orientation:'portrait', unit:'mm', format:'a4'});
    var pdfW = pdf.internal.pageSize.getWidth();
    var cw = canvas.width / 3.7795, ch = canvas.height / 3.7795;
    var ratio = Math.min(pdfW / cw, 240 / ch);
    pdf.addImage(img, 'JPEG', (pdfW - cw*ratio)/2, 20, cw*ratio, ch*ratio);
    pdf.save('WSF-Certificate-Verification.pdf');
  } catch(e) { alert('Download failed: ' + e.message); }
  if (btn) { btn.textContent = 'Download PDF'; btn.disabled = false; }
};

window.openVerifyModal = function() {
  var m = document.getElementById('verifyModal');
  if (m) m.classList.add('open');
};

// Auto-trigger from QR code URL
function tryAutoVerify() {
  var params = new URLSearchParams(window.location.search);
  var verifyId = params.get('verify');
  if (!verifyId) return;
  var modal = document.getElementById('verifyModal');
  var input = document.getElementById('certInput');
  var resultBox = document.getElementById('verifyResult');
  if (modal && input && resultBox) {
    modal.classList.add('open');
    if (document.body) document.body.style.overflow = 'hidden';
    input.value = verifyId;
    window.runVerification();
  } else {
    // Elements not ready yet, retry
    setTimeout(tryAutoVerify, 200);
  }
}

// Start trying as soon as possible
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() { setTimeout(tryAutoVerify, 500); });
} else {
  setTimeout(tryAutoVerify, 500);
}

})();
