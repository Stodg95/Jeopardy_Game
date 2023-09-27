const BASE_API_URL = "https://jservice.io/api/";
const NUM_CATEGORIES = 6;
const NUM_CLUES_PER_CAT = 5;
let categories = [];

/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category ids
 */

async function getCategoryIds() {
  // ask for 100 categories [most we can ask for], so we can pick random
  let response = await axios.get(`${BASE_API_URL}categories?count=100`);
  let catIds = response.data.map(c => c.id);
  return _.sampleSize(catIds, NUM_CATEGORIES);
}

/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null},
 *      ...
 *   ]
 */

async function getCategory(catId) {
  let response = await axios.get(`${BASE_API_URL}category?id=${catId}`);
  let cat = response.data;
  let allClues = cat.clues;
  let randomClues = _.sampleSize(allClues, NUM_CLUES_PER_CAT);
  let clues = randomClues.map(c => ({
    question: c.question,
    answer: c.answer,
    showing: null,
  }));

  return { title: cat.title, clues };
}

async function fillTable() {
  // Add row with headers for categories
  $("#jeopardy thead").empty();
  let $tr = $("<tr>");
  for (let catIdx = 0; catIdx < NUM_CATEGORIES; catIdx++) {
    $tr.append($("<th>").text(categories[catIdx].title));
  }
  $("#jeopardy thead").append($tr);

  // Add rows with questions for each category
  $("#jeopardy tbody").empty();
  for (let clueIdx = 0; clueIdx < NUM_CLUES_PER_CAT; clueIdx++) {
    let $tr = $("<tr>");
    for (let catIdx = 0; catIdx < NUM_CATEGORIES; catIdx++) {
      $tr.append($("<td>").attr("id", `${catIdx}-${clueIdx}`).text("?"));
    }
    $("#jeopardy tbody").append($tr);
  }
}

/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */

function handleClick(evt) {
  let id = evt.target.id;
  let [catId, clueId] = id.split("-");
  let clue = categories[catId].clues[clueId];
  let cell = $(evt.target);

  let msg;

  if (!clue.showing) {
    cell.addClass("question-showing");
    cell.removeClass("answer-showing");
    cell.text(clue.question);
    clue.showing = "question";
  } else if (clue.showing === "question") {
    cell.addClass("answer-showing");
    cell.removeClass("question-showing");
    cell.text(clue.answer);
    clue.showing = "answer";
  } else {
    // already showing answer; ignore
    return;
  }

  // Update text of cell
  $(`#${catId}-${clueId}`).html(msg);
}

function showLoadingSpinner() {
  $("#loading-spinner").show();
}

function hideLoadingSpinner() {
  $("#loading-spinner").hide();
}


/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */

async function setupAndStart() {
  showLoadingSpinner(); // Show the loading spinner
  let catIds = await getCategoryIds();

  categories = [];

  for (let catId of catIds) {
    categories.push(await getCategory(catId));
  }

  fillTable();
  hideLoadingSpinner(); // Hide the loading spinner when the content is loaded
}

/** On click of restart button, restart game. */

$("#restart").on("click", setupAndStart);

/** On page load, setup and start & add event handler for clicking clues */

$(async function () {
  showLoadingSpinner(); // Show the loading spinner on page load
  await setupAndStart();
  hideLoadingSpinner(); // Hide the loading spinner when the content is loaded
  $("#jeopardy").on("click", "td", handleClick);
});