// collect selected values from multiselect panel
function getMultiValues(containerId){
  const panel = document.querySelector('#'+containerId+' .ms-panel');
  if(!panel) return [];
  return Array.from(panel.querySelectorAll('input:checked')).map(i=>i.value);
}

document.getElementById('medicalForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const data = {
    name: document.getElementById('name').value || '',
    age: document.getElementById('age').value || '',
    bloodGroup: document.getElementById('bloodGroup').value || '',
    allergies: getMultiValues('allergies-ms'),
    medications: getMultiValues('medications-ms'),
    conditions: getMultiValues('conditions-ms'),
    heartDiseases: getMultiValues('heart-ms'), // optional
    additionalInfo: document.getElementById('additional').value || '',
    emergency: document.getElementById('emergency').value || ''
  };
  try {
    const res = await fetch('/api/saveRecord',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(data)
    });
    const json = await res.json();
    if(json.error) return alert('Error: '+json.error);
    // show QR image and link
    const qrArea = document.getElementById('qrResult');
    qrArea.innerHTML = '';
    const img = document.createElement('img');
    img.src = json.qr;
    img.alt = 'QR';
    img.style.maxWidth='200px';
    qrArea.appendChild(img);
    const linkArea = document.getElementById('linkArea');
    linkArea.innerHTML = '<p><strong>Profile link:</strong> <a href="'+json.profileUrl+'" target="_blank">'+json.profileUrl+'</a></p>';
    // close any open panels
    document.querySelectorAll('.ms-panel.open').forEach(p=>p.classList.remove('open'));
  } catch (err){
    console.error(err);
    alert('Unable to save. Check server is running.');
  }
});
