let thisQuiz;

const CORRECT_ANSWER_DIV = "border bg-success-subtle border-success-subtle";
const CORRECT_ANSWER_INPUT = "correct-ans";

const MISSED_ANSWER_DIV = "border border-success-subtle border-3";
const MISSED_ANSWER_LABEL = "text-success";

const INCORRECT_ANSWER_DIV = "border bg-danger-subtle border-danger-subtle";
const INCORRECT_ANSWER_INPUT = "incorrect-ans";

//Resets file on soft-refresh
window.addEventListener('load', function() {
  let file = document.getElementById("formFile");
  file.value = "";
  file.addEventListener('input', () => showQuestionSettings());

  checkOngoingExams();
});

/* ++++++++++++++++++++++++++++++++++++++++++++++++++++
NOTE: Structure of local JSON
Data items: currentQuiz, currentAnswers, remainingQuiz, quizChoice

currentQuiz     -->   the current questions and answers on the Quiz, the contents of genQuiz
originalJSON    -->   original uploaded file
quizName        -->   the name of the current Quiz, when being prompted to continue 
currentAnswers  -->   the currently selected answers 
remainingQuiz   -->   the remaining quiz in new JSON format
passingScore    -->   saved passing score

When to write to localStorage:
1. Add a save quiz button, save currentQuiz and currentAnswers to localStorage
2. After finishing a Quiz, save remainingQuiz to localStorage
+++++++++++++++++++++++++++++++++++++++++++++++++++++++  */

function checkOngoingExams() {
  const quizName = localStorage.getItem("quizName");
  const currentQuiz = JSON.parse(localStorage.getItem("currentQuiz"));
  const remainingQuiz = JSON.parse(localStorage.getItem("remainingQuiz"));
  const originalJSON = JSON.parse(localStorage.getItem("originalJSON"));
  const currentAnswers = JSON.parse(localStorage.getItem("currentAnswers"));
  const passingScore = parseInt(localStorage.getItem("passingScore"));

  const resumeModal = new bootstrap.Modal(document.getElementById('resumeModal'));

  document.getElementById("resume-title").innerText = `Resume ${quizName}`;

  //Resume previous quiz if current data is found.
  if(currentQuiz && currentAnswers){
    document.getElementById("resume-progress").innerText = `${Object.keys(currentAnswers).length} questions answered`;
    document.getElementById("resume-pending").innerText = `${Object.keys(currentQuiz).includes('images') ?
       Object.keys(currentQuiz).length - 1 - Object.keys(currentAnswers).length:
       Object.keys(currentQuiz).length - Object.keys(currentAnswers).length} questions pending`;
    
    resumeModal.show();
   
    //Option to continue the test
    document.getElementById("resume-A").addEventListener('click',e => resumeQuiz());
    //Restart quiz
    document.getElementById("resume-B").addEventListener('click',e => restartQuiz());
  }
  //Allow choosing a new exam pool
  else if(remainingQuiz){
    document.getElementById("promptText").innerText = `You can start a new quiz with leftover questions from ${quizName}.` 
    document.getElementById("resume-progress").innerText = `You have solved ${Object.keys(originalJSON).length - Object.keys(remainingQuiz).length} questions.`;
    document.getElementById("resume-pending").innerText = `${Object.keys(remainingQuiz).length} questions pending.`;
    resumeModal.show();

    //Option to continue the test
    document.getElementById("resume-A").addEventListener('click',e => {
      resumeModal.hide();
      showRemainingQuiz();
    });
    //Restart quiz
    document.getElementById("resume-B").addEventListener('click',e => restartQuiz());
  }

  function resumeQuiz(){
    resumeModal.hide();
    document.getElementById("formFile").toggleAttribute("disabled");
    document.getElementById("reload-page").removeAttribute("hidden");
    document.getElementById("reload-page").addEventListener("click",e => localStorage.clear());


    new Quiz(originalJSON, 
      currentQuiz, 
      Object.keys(currentQuiz).includes('images') ? Object.keys(currentQuiz).length - 1: Object.keys(currentQuiz).length,
      passingScore);
    //
    selectSavedAnswers();
  }

  function restartQuiz(){
    resumeModal.hide();
    localStorage.clear();
  }

  //Checks all the answers in currentAnswers
  function selectSavedAnswers(){
    for (const [question, answers] of Object.entries(currentAnswers)) {
      answers.split("").forEach(answer => document.querySelector(`input[id^=ANS-${question}-${answer}]`).setAttribute("checked", true));
    }
  }
}

//Show settings when quiz is resumed, a clone of showQuestionSettings
function showRemainingQuiz(){
  const filePicker = document.getElementById("formFile");


  document.getElementById("quizSettings").removeAttribute("hidden"); 
  filePicker.toggleAttribute("hidden");

  const parsedJSON = JSON.parse(localStorage.getItem("remainingQuiz"));
  const quizName = localStorage.getItem("quizName");
  document.title = quizName + " | " + new Date(Date.now()).toDateString().split(" ").slice(1,3).toString().replaceAll(",", "-");
  document.querySelector("h1").innerText = quizName;

  //Show special text when resuming a Quiz
  const fileTitle = document.querySelector(".form-label[for=formFile]");
  fileTitle.innerText = `Solving the remaining quiz questions.`;
  fileTitle.classList += "fw-bold fst-italic text-primary-emphasis mb-2 fs-5";

  document.getElementById("load-quiz").removeAttribute("hidden");
  document.getElementById("reload-page").removeAttribute("hidden");
  document.getElementById("reload-page").addEventListener("click",e => localStorage.clear());

  //Read JSON file and display settings dynamically
  const totalQuestions = Object.keys(parsedJSON).includes('images') ? Object.keys(parsedJSON).length - 1: Object.keys(parsedJSON).length;

  //Format page with updated info from JSON
  const numberOfQuestions1 = document.getElementById("numberOfQuestions1");
  const numberOfQuestions2 = document.getElementById("numberOfQuestions2");
  const passingScore1 = document.getElementById("passingScore1");
  const passingScore2 = document.getElementById("passingScore2");

  if(totalQuestions < 10){
    numberOfQuestions1.min = 1;
    numberOfQuestions2.min = 1;
  }

  numberOfQuestions1.max = totalQuestions;
  numberOfQuestions2.max = totalQuestions;

  numberOfQuestions1.value = totalQuestions;
  numberOfQuestions2.value = totalQuestions;
  document.querySelector('.form-label[for="numberOfQuestions1"]').innerText = `Number of Questions (${numberOfQuestions1.min}-${totalQuestions})`;

  document.getElementById("load-quiz").onclick = () => {
    document.getElementById("load-quiz").toggleAttribute("hidden");
    numberOfQuestions1.toggleAttribute("disabled");
    numberOfQuestions2.toggleAttribute("disabled");
    passingScore1.toggleAttribute("disabled");
    passingScore2.toggleAttribute("disabled");

    processJSON(parsedJSON, numberOfQuestions1.value, "answer_community", passingScore1);
  }
}

//Update form when a file is selected
function showQuestionSettings(){
  const JSONfile = document.getElementById("formFile").files[0];

  document.getElementById("formFile").setAttribute("disabled","");
  document.getElementById("quizSettings").removeAttribute("hidden");  

  //Change tab and page titles to reflect exam
  const quizName = JSONfile.name.split(".json").join("");
  document.title = quizName + " | " + new Date(Date.now()).toDateString().split(" ").slice(1,3).toString().replaceAll(",", "-");
  document.querySelector("h1").innerText = quizName;
  localStorage.setItem("quizName", quizName);

  document.getElementById("load-quiz").removeAttribute("hidden");
  document.getElementById("reload-page").removeAttribute("hidden");
  document.getElementById("reload-page").addEventListener("click",e => localStorage.clear());


  //Read JSON file and display settings dynamically
  const reader = new FileReader();
  reader.addEventListener(
    "loadend",
    () => {
      let parsedJSON = JSON.parse(reader.result);
      localStorage.setItem("originalJSON", JSON.stringify(parsedJSON));
      const totalQuestions = Object.keys(parsedJSON).includes('images') ? Object.keys(parsedJSON).length - 1: Object.keys(parsedJSON).length;

      //Format page with updated info from JSON
      const numberOfQuestions1 = document.getElementById("numberOfQuestions1");
      const numberOfQuestions2 = document.getElementById("numberOfQuestions2");
      const passingScore1 = document.getElementById("passingScore1");
      const passingScore2 = document.getElementById("passingScore2");

      numberOfQuestions1.max = totalQuestions;
      numberOfQuestions2.max = totalQuestions;

      numberOfQuestions1.value = totalQuestions;
      numberOfQuestions2.value = totalQuestions;
      document.querySelector('.form-label[for="numberOfQuestions1"]').innerText = `Number of Questions (10-${totalQuestions})`;

      document.getElementById("load-quiz").onclick = () => {
        document.getElementById("load-quiz").toggleAttribute("hidden");
        numberOfQuestions1.toggleAttribute("disabled");
        numberOfQuestions2.toggleAttribute("disabled");
        passingScore1.toggleAttribute("disabled");
        passingScore2.toggleAttribute("disabled");

        processJSON(parsedJSON, numberOfQuestions1.value, "answer_community", passingScore1);
      }
    },
    false,
  );
  if (JSONfile) {
    reader.readAsText(JSONfile, "UTF-8");
  }
}


//Used for question sliders
function updateVal(elId, val) {
  document.getElementById(elId).value = val;
}

function getRndInteger(max) {
  return Math.floor(Math.random() * max); 
}

//Sets light or dark theme
function setColor(color){
  document.getElementsByTagName("html")[0].attributes['data-bs-theme'].value = color;
}

function scrolltoChangelog(){
  let changelog = document.getElementById("changelog");

  changelog.addEventListener('shown.bs.collapse', () => {changelog.scrollIntoView()});
}

//For Bootstrap accordions
const collapseElementList = document.querySelectorAll('.collapse');
const collapseList = [...collapseElementList].map(collapseEl => new bootstrap.Collapse(collapseEl));

/*INPUTS: q_json: the question file in JSON format
           numQuestions: number of questions
           questionsType: either community or official answers
*/
function processJSON(q_json, numQuestions, questionsType, passingScore){
  let jsonArr =  Object.keys(q_json);
  let remainingQuiz = {}; //Leftover questions, may be saved to localStorage

  
  let genQuiz = {}; //structure: {1: {qNum: 'X', qAns: 'YZ', qShow: 'CABE}, 2...}
  for(var i = 0; i < numQuestions; i++){
    genQuiz[i] = {'qNum':'Z', 'qAns':'ZZZ', 'qShow':'XXX'};
  }

  if(jsonArr.indexOf("images") > 0) jsonArr.pop(); //Prevents the images from being selected as questions



  // Create array with random selection of questions from uploaded JSON
  for(var i = 0; i < numQuestions; i++){
    var x = getRndInteger(jsonArr.length);
    genQuiz[i]['qNum'] = jsonArr.splice(x,1);
  }

  if (jsonArr.length > 0) {
    jsonArr.forEach(val => remainingQuiz[val] = q_json[val]); //Filling remainingQuiz with leftover questions
    if (q_json.images) {
      remainingQuiz.images = q_json.images; //remainingJSON will include all images
    }
    //Save remaining quiz data
    localStorage.setItem("remainingQuiz", JSON.stringify(remainingQuiz));
  }
  else{
    localStorage.removeItem("remainingQuiz");
  }

  //Create array with the original answers corresponding to the question selection
  for(var i = 0; i < numQuestions; i++){
    genQuiz[i]['qAns'] = q_json[genQuiz[i]['qNum']][questionsType];
  }
  thisQuiz = new Quiz(q_json, genQuiz, numQuestions, passingScore);
}

class Quiz {
  genQuiz;
  numQuestions;
  userAnswers;
  score;

  constructor(jsonQuiz, genQuiz, numQuestions, passingScore) {
    this.jsonQuiz = jsonQuiz;
    this.genQuiz = genQuiz;

    this.numQuestions = numQuestions;
    this.passingScore = passingScore;

    this.score = 0;

    //checking images in json
    if(jsonQuiz.images && Object.getOwnPropertyNames(jsonQuiz.images).length > 0){
      this.hasImages = true;
    }

    //If a quiz is ongoing, skip the option randomization
    const currentQuiz = JSON.parse(localStorage.getItem("currentQuiz"));
    const currentAnswers = JSON.parse(localStorage.getItem("currentAnswers"));

    if(currentQuiz && currentAnswers){
      for (var i = 0; i < Object.keys(this.genQuiz).length; i++) {
        this.genQuiz[i]["qShow"] = currentQuiz[i]["qShow"];
      }
    }
    else{
      for (var i = 0; i < Object.keys(this.genQuiz).length; i++) {
        this.genQuiz[i]["qShow"] = this.randomizeOptions(i);
      }
    }
    console.log(this.genQuiz);

    let loadButton = document.getElementById("load-quiz");
    loadButton.setAttribute("disabled", "");

    localStorage.setItem("currentQuiz", JSON.stringify(this.genQuiz));

    this.showQuiz();
    document.getElementById("submit-quiz").addEventListener("click",this,false); //adding eventListener to Class
  }

  saveCurrentAnswers(event){
    const selections = document.querySelectorAll("input:checked");
    let selectedQuestions = {};

    selections.forEach(el => {
      const question = el.id.split("-")[1];
      const answer = el.id.split("-")[2];
      selectedQuestions[question] ? selectedQuestions[question] += answer: selectedQuestions[question] = answer; 
    });

    localStorage.setItem("currentAnswers", JSON.stringify(selectedQuestions));
  };

  showQuiz() { //Generates all the questions and a submit button
    let accordionQuestions = document.getElementById("accordionQuestions");

    for (var i = 0; i < this.numQuestions; i++) accordionQuestions.appendChild(this.createQuestionChoices(i));
    this.appendSubmit();
    document.getElementById("accordionQuestions").addEventListener("input", e => this.saveCurrentAnswers(e));
  }

  getQuestionText(q_num) {
    return this.jsonQuiz[this.genQuiz[q_num]["qNum"]]["question"];
  }

  showOptionText(q_num, letter, displayLetter = "Z") {
    if (displayLetter !== "Z") {
      return displayLetter + ". " + this.jsonQuiz[this.genQuiz[q_num]["qNum"]]["options"][letter];
    }
    return letter + ". " + this.jsonQuiz[this.genQuiz[q_num]["qNum"]]["options"][letter];
  }

  showOptions(q_num, multiChoice = false) {
    var a_z = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let stringOptions = "";


    for (var i = 0; i < Object.keys(this.genQuiz[q_num].qShow).length; i++) {
      stringOptions += `<div class="form-check" id="${q_num + 1}-${a_z[i]}">
          <input class="form-check-input ms-1" type="${multiChoice ? "checkbox" : "radio"}" name="ANS-${q_num + 1}" id="ANS-${q_num + 1}-${a_z[i]}" value="ANS-${q_num + 1}-${a_z[i]}">
          <label class="form-check-label ms-2 inline-q" for="ANS-${q_num + 1}-${a_z[i]}"> ${this.showOptionText(q_num, this.genQuiz[q_num].qShow[i], a_z[i])}</label>
          </div>`;
    }

    return stringOptions;
  }

  showImage(q_num){
    let img = document.createElement("img");
    img.className = "mb-3 mx-auto d-block mw-100";
    img.src = `data:image/png;base64,${this.jsonQuiz.images[this.genQuiz[q_num]["qNum"]]}`;
    return img;
  }

  createQuestionChoices(q_num) {
    var questionItem = document.createElement("div");
    questionItem.className = `accordion-item${q_num > 0 ? " mt-4" : ""}`;
    questionItem.id = `Q-${q_num + 1}`;

    var questionHeader = document.createElement("h2");
    questionHeader.className = 'accordion-header';
    questionHeader.innerHTML = `<button class="accordion-button border-top" type="button" data-bs-toggle="collapse"
        data-bs-target="#collapse${q_num + 1}" aria-expanded="false" aria-controls="collapse${q_num + 1}">
        Question ${q_num + 1}</button>`;
    questionItem.appendChild(questionHeader);

    var questionBody = document.createElement("div");
    questionBody.className = "accordion-collapse pb-2 collapse show";
    questionBody.id = `collapse${q_num + 1}`;

    var accordionBody = document.createElement("div");
    accordionBody.className = "accordion-body";

    accordionBody.innerHTML = `<p class="mb-4">${this.getQuestionText(q_num)}</p>`
    
    if(this.jsonQuiz.images){
      if(this.jsonQuiz.images[this.genQuiz[q_num]["qNum"]]){
        accordionBody.appendChild(this.showImage(q_num))
      }
    }

    accordionBody.innerHTML += this.showOptions(q_num, this.genQuiz[q_num].qAns.length > 1 ? true : false);

    questionBody.appendChild(accordionBody);
    questionItem.appendChild(questionBody);

    return questionItem;
  }

  appendSubmit() {
    let body = document.getElementsByTagName("body")[0];
    let footer = document.getElementsByTagName("footer")[0];
    let submitDiv = document.createElement("div");

    submitDiv.className = "container text-center mt-4";
    submitDiv.innerHTML = `<button type="button" class="btn btn-success btn-lg" id="submit-quiz">Submit</button>`;

    body.insertBefore(submitDiv, footer);
  }

  randomizeOptions(q_num) { //returns randomized options in qShow format (e.g. "ABCD" -> "DABC")
    let defOptions = Object.keys(this.jsonQuiz[this.genQuiz[q_num]["qNum"]]["options"]);
    let randOptions = defOptions.sort(() => Math.random() - 0.5);
    let randString = "";

    for (var i = 0; i < randOptions.length; i++) {
      randString += randOptions[i];
    }
    return randString;
  }

  getQuestionNumberFromAnswer(inputDiv){
    return inputDiv.id.split("-")[1];
  }

  getLetterFromAnswer(inputDiv){
    let selected = inputDiv.id.split("-")[2];
    return selected ? selected : "*"; //If unanswered, returns null character
  }

  translateSourceAnswer(genQuizItem){//needs the input of one GenQuiz entry. It must have the 'selected' property. Translates selections to JSON file original choices
    //If qAns is set to True will return the original question's answer translated with the randomizer
    let alphabetKey = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let translation = "";

    for(var i = 0; i < genQuizItem.qAns.length; i++) {
      //translation += genQuizItem["qShow"][alphabetKey.indexOf(genQuizItem["qAns"][i])];
      translation += alphabetKey[genQuizItem["qShow"].indexOf(genQuizItem["qAns"][i])];
    }

    return translation.split("").sort().join("");
  }

  styleChoices(genQuizItem, index){
    if(genQuizItem.selected){//If not empty answers
      if (genQuizItem.translatedAnswer == 1) {//Single choice
        if (isCorrect(genQuizItem)) {
          styleCorrectAnswer((index + 1).toString() + "-" + genQuizItem["selected"]);
        }
        else {
          styleIncorrectAnswer((index + 1).toString() + "-" + genQuizItem["selected"]);
          styleMissedAnswer((index + 1).toString() + "-" + genQuizItem["translatedAnswer"]);
        }
      }
      else{ //Multiple Choice
        for(const choice of genQuizItem.selected){ //Styles picked answers
          genQuizItem["translatedAnswer"].includes(choice) ? styleCorrectAnswer((index+1).toString() + "-" + choice) : styleIncorrectAnswer((index+1).toString() + "-" + choice);
        }

        for(const choiceOK of genQuizItem["translatedAnswer"]){ //Styles missed answers
          if(!genQuizItem.selected.includes(choiceOK)){
            styleMissedAnswer((index+1).toString() + "-" + choiceOK);
          }
        }
      }
    }
    else{ //EMPTY ANSWERS
      if(genQuizItem.qAns.length == 1){ //Single choice empty answers
        styleMissedAnswer((index+1).toString() + "-" + genQuizItem["translatedAnswer"]);
      }
      else{ //Multiple choice empty answers
        for (const choiceOK of genQuizItem["translatedAnswer"]) {
          styleMissedAnswer((index + 1).toString() + "-" + choiceOK);
        }
      }
    }

    //STYLE ANSWERS: input: string in the form of [question]-[choice]. Example: 12-C
    //Will style the selected 
    function styleCorrectAnswer(id){
      document.getElementById(id).classList += " " + CORRECT_ANSWER_DIV; //PARENT DIV FOR ANSWER
      document.getElementById("ANS-" + id).classList += " " + CORRECT_ANSWER_INPUT; //DIV FOR RADIO BUTTON/CHECKBOX
    }
    function styleIncorrectAnswer(id){
      document.getElementById(id).classList += " " + INCORRECT_ANSWER_DIV; //PARENT DIV FOR ANSWER
      document.getElementById("ANS-" + id).classList += " " + INCORRECT_ANSWER_INPUT; //DIV FOR RADIO BUTTON/CHECKBOX
    }
    function styleMissedAnswer(id){
      document.getElementById(id).classList += " " + MISSED_ANSWER_DIV; //PARENT DIV FOR ANSWER
      document.querySelector("label[for=ANS-" + id).classList += " " + MISSED_ANSWER_LABEL; //LABEL TEXT DIV
      document.getElementById("ANS-" + id).setAttribute("style", "opacity:0.7 !important; margin-left: calc(.25rem - 2.4px) !important;"); //FIXES BUTTON MOVING ON ADDING BORDER
    }

    function isCorrect(quizItem){
      return quizItem.selected ? quizItem["selected"] == quizItem["translatedAnswer"] : false;
    }

  }

  disableChoices(){ //disables choices while retaining some opacity and submit button
    let allAnswers = document.querySelectorAll("input[id^=ANS]");
    let allLabels = document.querySelectorAll("label[for^=ANS]");

    for(const ANSWER of allAnswers){
      ANSWER.setAttribute("disabled","");
      ANSWER.setAttribute("style", "opacity:0.7 !important");
    }

    for(const LABEL of allLabels){
      LABEL.setAttribute("style", "opacity:0.7 !important");
    }

    document.getElementById("submit-quiz").setAttribute("disabled", "");
  }
  
  checkAnswers(){
    let checkedAnswers = document.querySelectorAll("input[id^=ANS]:checked");
    this.disableChoices();
    
    for(const ans of checkedAnswers){ //adds "selected" property to each genQuiz question
      if(this.genQuiz[this.getQuestionNumberFromAnswer(ans)-1]["selected"] === undefined){
        this.genQuiz[this.getQuestionNumberFromAnswer(ans)-1]["selected"] = this.getLetterFromAnswer(ans);
      }
      else{
        this.genQuiz[this.getQuestionNumberFromAnswer(ans)-1]["selected"] += this.getLetterFromAnswer(ans);
      }
    }

    for(var i = 0; i < this.numQuestions; i++){ //adds a version of selected that matches the original JSON, then checks for correct answer
      this.genQuiz[i]["translatedAnswer"] = this.translateSourceAnswer(this.genQuiz[i], true);

      let badge = document.createElement("span");
      let originalAnswer = document.createElement("div");

      //Add original question text
      originalAnswer.className = "mt-3"; 
      originalAnswer.innerText = "Original Question #:   " + this.genQuiz[i]["qNum"]; 
      document.getElementById("Q-"+(i+1)).lastChild.firstChild.appendChild(originalAnswer);


      if(this.genQuiz[i]["translatedAnswer"] == this.genQuiz[i]["selected"]){ //checks each answer for correctness, then adds score and badge
        this.score +=1;
        badge.className = "badge bg-success ms-3";
        badge.innerText = "Correct";
      }
      else{
        badge.className = "badge bg-danger ms-3";
        badge.innerText = "Incorrect";
      }
      document.getElementById("Q-"+(i+1)).firstChild.firstChild.appendChild(badge);

      this.styleChoices(this.genQuiz[i], i);
      
    }

    this.showScoreAndReturn();
  }

  showScoreAndReturn(){
    const grade = this.score / parseInt(this.numQuestions) * 100;
    const passingGrade = parseInt(this.passingScore.value);

    let pass = grade / passingGrade;

    console.log("Grade: ", grade, "\t passingGrade: ", passingGrade);

    let resultsHTML = `<div id="results" class="container col-md-10 mt-5">
    <div class="card border-${pass ? "success" : "danger"}">
        <div class="card-header bg-${pass ? "success" : "danger"} text-center"> <h3>Results</h3> </div>
        <div class="card-body text-center"> <h2>${this.score}/${this.numQuestions}</h2>
            <h3 class="text-${pass ? "success" : "danger"}"><strong>${pass ? `PASS` : "FAIL"} (${Math.round(grade * 100) / 100}%)</strong></h3>
            <button class="btn btn-warning btn-sm mt-3" onClick="location.reload()">Restart Test</button>
        </div>
      </div>
    </div>`;

    document.getElementById("questionSettings").insertAdjacentHTML("afterend", resultsHTML);
    document.getElementById("results").scrollIntoView();

    //Removing current quiz info
    localStorage.removeItem("currentQuiz");
    localStorage.removeItem("currentAnswers");
  }

  handleEvent(event){
    switch (event.type){
      case "click":
        this.checkAnswers();
        break;
    }
  }
}