const projectNameInput = document.querySelector('#projectNameInput')
const projectDescInput = document.querySelector('#projectDescInput')
const projectEmailInput = document.querySelector('#projectEmailInput') //.value.trim();
const createProjectSubmit = document.querySelector('#createProjectSubmit')

const addEmailButton = document.querySelector('#addEmailButton');

// Contains all emails that will have access to new project
const emails = []

const getNextAvailableProjectId = async () => {
    let response = await fetch('/api/projects/', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
    })
    let data = await response.json()
    let nextProjectID = Math.max(...data.map(object => Number(object.id))) + 1
    return nextProjectID

}

console.log(addEmailButton)

addEmailButton.addEventListener('click', () => {
    let email = projectEmailInput.value.trim();
    emails.push(email)
    console.log(emails)
    appendEmails()
})

function appendEmails() {
    const insertEmailSection = document.querySelectorAll('#emailList');
    let div = document.createElement('div');
    let h6 = document.createElement('h6');
    let button = document.createElement('button');

    button.classList.add('btn-close', 'btn-sm');
    div.classList.add('emailListiing', 'd-flex', 'gap-2', 'align-items-center')

    let content = emails[emails.length - 1];

    h6.innerHTML = content;

    console.log(h6)
    div.appendChild(h6);
    div.appendChild(button);

    insertEmailSection[0].appendChild(div)
}

projectDescInput.addEventListener('keydown', () => {
    let charsRemainingElement = document.querySelector('#charsRemaining');
    let string = projectDescInput.value.length + 1;
    let charsRemaining = (100 - string).toString();
    charsRemainingElement.innerHTML = charsRemaining;
})

//FETCH POST
const assignMembersToProjectHandler = async (projectID) => {
    // let tempEmails = ["sal@hotmail.com", "lernantino@gmail.com"]
    emails.forEach(async(email) => {
        const response = await fetch ('api/users/')
        const data = await response.json()
        const userData = await data.find(user => user.email == email)
        const response1 = await fetch('/api/projects/UTR', {
            method: 'POST',
            body: JSON.stringify({ user_id:userData.id, project_id:projectID}),
            headers: { 'Content-Type': 'application/json' }
        })
        if (response1.ok) {
            console.log("member added")
        }



    })
}

const createProjectHandler = async (e) => {
    e.preventDefault();
    const name = projectNameInput.value.trim();
    const description = projectDescInput.value.trim();
    const nextProjectID = await getNextAvailableProjectId()

    if (name && description) {
        const response = await fetch('/api/projects', {
            method: 'POST',
            body: JSON.stringify({ id: nextProjectID, name:name, description:description }),
            headers: { 'Content-Type': 'application/json' },
        })
        if(response.ok){
            assignMembersToProjectHandler(nextProjectID)
            // document.location.replace('/users')








        }else{
            alert('Failed to create project')
        }
    }
}

createProjectSubmit.addEventListener('click', createProjectHandler)
