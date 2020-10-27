"use strict";
// git pages
const $form = $("#dad-form");
const $topic = $("#topic");
const $results = $("#results");
const DAD_KEY = "168487ec-8335-4929-b31c-1b0b3ab783ad";

const URL = "https://dad-joke-server.herokuapp.com/"

// disable search while handleSubmit() is running
let searching = false;

async function handleSubmit(e) {
  try {
    e.preventDefault();
    // remove current slide
    $results.children().first().addClass("struggle");
    // prevent from running if already searching for a new joke
    if (searching) return;
    searching = true;
    // get user input
    const topic = encodeURIComponent($topic.val());
    //fetch random joke text or joke text based on topic.
    const joke = topic ? await getJokeByTopic(topic) : await getRandomJoke();
    const image = await selectAndLoadImage(joke.images);
    $results.children().first().removeClass("struggle").addClass('slide-to-right')
    .on('animationend',function(){$(this).remove()});
    displayJoke(joke.joke, image);
    searching = false;
  } catch (error) {
    console.log(error);
    searching = false;
    $form[0].reset();
    displayError();
  }
}

// Get joke text
async function getJokeByTopic(subject) {
  const response = await fetch(
    URL + `search?subject=${subject}&key=${DAD_KEY}`
  );
  if (!response.ok)
    throw new Error(response.status + ": " + response.statusText);
  const data = await response.json();
  return data;
}

async function getRandomJoke() {
  const response = await fetch(`${URL}random?key=${DAD_KEY}`);
  if (!response.ok)
    throw new Error(response.status + ": " + response.statusText);
  const data = await response.json();
  return data;
}

async function ping (){
  const response = await fetch(`${URL}?key=168487ec-8335-4929-b31c-1b0b3ab783ad`)
  const data = await response.text()
}

function selectAndLoadImage(imagesArray) {
  return new Promise((resolve, reject) => {
    function loop() {
      if (imagesArray.length === 0) reject("no valid images");
      const urlIndex = Math.floor(Math.random() * imagesArray.length);
      const jokeImageObject = imagesArray.splice(urlIndex, 1)[0];
      const image = document.createElement("img");

      image.src =
        screen.width <= 500
          ? jokeImageObject.thumbnailUrl
          : jokeImageObject.contentUrl;

      if (image.complete) resolve(image);

      const timeout = setTimeout(() => {
        loop();
      }, 2000);

      $(image).on("load", () => {
        clearTimeout(timeout);
        resolve(image);
      });

      $(image).on("error", () => {
        clearTimeout(timeout);
        loop();
      });
    }
    loop();
  });
}
// display formatted joke and image

function displayJoke(jokeText, image) {
  let $card = $(
    `<div class="card slide-from-left">
            <h4 class="joke-text">${jokeText}</h4>
        </div>`
  );
  $card.append(image);
  $results.prepend($card);
}

function displayError() {
  // display error card once current card it gone
  $(".card")
    .addClass("slide-to-right")
    .on("animationend", () => {
      $results.html(
        `<div class="card slide-from-left">
                        <h4>Error: This is not the topic you are looking for</h4>
                        <img src="https://media.giphy.com/media/4560Nv2656Gv0Lvp9F/giphy.gif">
                    </div>`
      );
    });
}

function handleStart(e) {
  $(this)
    .css({ opacity: 1.0, visibility: "visible" })
    .animate({ opacity: 0 }, 200);
  $("#dad-form").addClass("slide-from-left");
}

function runApp() {
  // run ping to wake up cloud server. Speed up first joke load.
  ping().catch(e=>console.log(e))
  $form.on("submit", handleSubmit);
  $("nav a").on("click", (event) => {
    $(event.target).addClass("active");
    $("nav a").not(event.target).removeClass("active");
  });
  $("#start-btn").on("click", handleStart);
}

$(runApp);
