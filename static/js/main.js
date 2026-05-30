document.addEventListener('DOMContentLoaded', function(){
  const photoInput = document.querySelector('input[name="profile_photo"]');
  if(photoInput){
    let imgHolder = document.createElement('div');
    imgHolder.className = 'photo-preview';
    photoInput.parentNode.appendChild(imgHolder);
    photoInput.addEventListener('change', function(e){
      const file = e.target.files[0];
      imgHolder.innerHTML = '';
      if(!file) return;
      const img = document.createElement('img');
      img.className = 'img-preview img-fluid mb-2';
      img.src = URL.createObjectURL(file);
      imgHolder.appendChild(img);
    });
  }

  const idInput = document.querySelector('input[name="id_proof"]');
  if(idInput){
    let idHolder = document.createElement('div');
    idHolder.className = 'id-preview small text-muted';
    idInput.parentNode.appendChild(idHolder);
    idInput.addEventListener('change', function(e){
      const file = e.target.files[0];
      idHolder.innerHTML = file ? `Selected: ${file.name}` : '';
    });
  }

  const dobInput = document.querySelector('input[name="date_of_birth"]');
  const ageInput = document.querySelector('input[name="age"]');
  if(dobInput && ageInput){
    dobInput.addEventListener('change', function(e){
      const d = new Date(e.target.value);
      if(!d || isNaN(d)) return;
      const today = new Date();
      let age = today.getFullYear() - d.getFullYear();
      const m = today.getMonth() - d.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
      ageInput.value = age;
    });
  }
});

// Dashboard chart helper
function renderApprovalChart(canvasId, approved, pending){
  const ctx = document.getElementById(canvasId);
  if(!ctx) return;
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Approved','Pending'],
      datasets: [{
        data: [approved, pending],
        backgroundColor: ['#198754','#ffc107']
      }]
    },
    options: {responsive:true, maintainAspectRatio:false}
  });
}
