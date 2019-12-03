let uploadPP = document.getElementById('upload-pp');
let updatePP = document.getElementById('update-pp');
let deletePP = document.getElementById('delete-pp');
let ppFormUpload = document.getElementById('pp-form-upload');
let ppFormUpdate = document.getElementById('pp-form-update');
let ppFormDelete = document.getElementById('pp-form-delete');
let workDelBtn = document.getElementById('work-del-btn')
let workDeletDiv = document.getElementById('work-delete');
let workNoDel = document.getElementById('work-no-del');

if(uploadPP){
    uploadPP.addEventListener('click', function(){
        $('#pp-form-upload').slideToggle(400);
    });
}

if(updatePP){
    updatePP.addEventListener('click', function(){
        $('#pp-form-update').slideToggle(400);
        deletePP.classList.toggle('display-none');
    });
}

if(deletePP){
    deletePP.addEventListener('click', function(){
        $('#pp-form-delete').slideToggle(400);
        updatePP.classList.toggle('display-none');
    });
    document.getElementById('no').addEventListener('click', function(){
        $('#pp-form-delete').slideUp(400);
        updatePP.classList.toggle('display-none');
    });
}

if (workDelBtn){
    workDelBtn.addEventListener('click', function(){
        $('#work-delete').slideToggle(400);
    });
    workNoDel.addEventListener('click', function(){
        $('#work-delete').slideUp(400);
    });
}



