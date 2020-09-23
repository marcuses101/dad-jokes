"use strict"
// git pages
const $form = $("#dad-form");
const $topic = $("#topic");
const $results = $("#results");
const dadURL = "https://icanhazdadjoke.com/";
const entitiesURL = `https://language.googleapis.com/v1beta2/documents:analyzeEntities`;
// if running locally use IP restricted key, else domain restricted key
const G_API_KEY = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    ? 'AIzaSyAZDw24a7VN9oXC1X01JfhI2Fm-fMAXXYs'
    : 'AIzaSyCeg3qyipDzL4M0oibcrbF_MoepU7iXk3I';
const imageURL = `https://api.cognitive.microsoft.com//bing/v7.0/images/search`;
const AZURE_KEY = `dcb174f76ef74c55bd2ced6b4152bae6`;
// exclude words that don't produce relevant image search results
const excludedSearchTerms = [
    "difference",
    "experience",
    "Legend-dairy",
    "someone",
    "man",
    "dad",
    "one",
    "person",
    "bad",
    "Q",
    "reservation",
    "group",
    "something",
    "kind",
    "puns",
    "word",
    "rest",
    "people",
    "add",
    "thing",
    "guy",
    "Someone",
    "someone",
    "pun",
    "pair"
]
// disable search while handleSubmit() is running
let searching = false;

async function handleSubmit(e) {
    try {
        e.preventDefault();
        // remove current slide
        $results.children().first().addClass("slide-to-right");
        // prevent from running if already searching for a new joke
        if (searching) return;
        searching = true;
        // get user input
        const topic = $topic.val();
        //fetch random joke text or joke text based on topic.
        let jokeText = topic
            ? await getJokeByTopic(topic)
            : await getRandomJoke();
        if (!jokeText) throw new Error("Could not find Joke");
        // get joke subject. Will default to "dad" on error.
        const jokeSubject = await processJokeText(jokeText);
        const imagesData = await getJokeImageData(jokeSubject);
        // load image. If image fails to load get another.
        let jokeImage = await selectAndLoadImage(imagesData);
        while (!jokeImage) {
            jokeImage = await selectAndLoadImage(imagesData);
        }
        displayJoke(jokeText, jokeImage);
        searching = false;
    }
    catch (error) {
        console.log(error);
        searching = false;
        $form[0].reset();
        displayError();
    }

}


// Get joke text
async function getJokeByTopic(topic) {
    try {
        const url = `${dadURL}search?term=${encodeURIComponent(topic.trim())}&limit=1`;
        // check the number of results in the initial response, use that to search for a random joke in the topic
        const initialResponse = await fetch(url, { headers: { "Accept": "application/json" } });
        const initialData = await initialResponse.json();
        if (!initialResponse.ok) throw new Error(initialResponse.status + ": " + initialResponse.statusText);
        const randomJokePage = Math.ceil(Math.random() * initialData.total_pages);
        const randomJokeURL = `${url}&page=${randomJokePage}`;
        const response = await fetch(randomJokeURL, { headers: { "Accept": "application/json" } });
        const data = await response.json();
        if (data.results.length > 0) {
            return data.results[0].joke;
        } else {
            return false;
        }
    }
    catch (error) {
        console.log(error);
    }
}

async function getRandomJoke() {
    try {
        const response = await fetch(dadURL, { headers: { "Accept": "application/json" } });
        if (!response.ok) throw new Error(response.status + ": " + response.statusText);
        const data = await response.json();
        return data.joke;
    } catch (error) {
        console.log(error);
    }
}

// process joke text extract key words
async function processJokeText(joke) {
    const jokeToSearch = joke.replace(/\n/g, " ");
    const body = {
        "document": {
            content: jokeToSearch,
            type: "PLAIN_TEXT"
        },
        "encodingType": "NONE"
    };
    try {
        let response = await fetch(entitiesURL + `?key=${G_API_KEY}`, {
            method: "POST",
            body: JSON.stringify(body)
        });
        if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
        const data = await response.json();
        // return if no entities found
        if (data.entities.length === 0) return "dad";
        let index = 0;
        // check if entity is in the excludedSearchTerms list
        while (excludedSearchTerms.includes(data.entities[index].name)) {
            index++;
        }
        const entity = data.entities[index].name;
        if (entity === "girl") return "woman";
        // split two word entity
        return /\s/.test(entity)
            ? entity.split(" ")[0]
            : entity;

    } catch (error) {
        console.log(error);
        return "dad";
    }

}

// get cheesy images to display with joke
async function getJokeImageData(keyword) {
    const query = `?q=${keyword}&imagetype=clipart&count=10`;
    const fullURL = imageURL + query;
    try {
        const response = await fetch(fullURL, {
            headers: {
                "Ocp-Apim-Subscription-Key": AZURE_KEY
            }
        });
        if (!response.ok) throw new Error(response.status + ": " + response.statusText);
        const data = await response.json();
        return data;
    } catch (error) {
        console.log(error);
    }

}
// return and object containing an <img> and the associated bing result. 
// return false if image fails to load.
function selectAndLoadImage(jokeData) {
    return new Promise((resolve) => {
        // randomly select image in the first 10 results
        const urlIndex = Math.floor(Math.random() * jokeData.value.length);
        // remove image from image pool.
        const jokeImageObject = jokeData.value.splice(urlIndex, 1)[0];
        const image = document.createElement("img");
        // use lower res image on smaller devices
        image.src = (screen.width <= 500)
            ? jokeImageObject.thumbnailUrl
            : jokeImageObject.contentUrl;
        if (image.complete) resolve(image);
        $(image).on("load", () => {
            resolve(image);
        })
        $(image).on("error", () => { resolve(false); })
        setTimeout(() => { resolve(false); }, 5000);
    })

}

// display formatted joke and image

function displayJoke(jokeText, image) {

    let $card = $(
        `<div class="card slide-from-left">
            <h4 class="joke-text">${jokeText}</h4>
        </div>`
    );
    $card.append(image);
    $results.html($card);
}

function displayError() {
    // display error card once current card it gone
    $(".card").addClass("slide-to-right").on("animationend", () => {
        $results.html(
            `<div class="card slide-from-left">
                        <h4>Error: This is not the topic you are looking for</h4>
                        <img src="https://media.giphy.com/media/4560Nv2656Gv0Lvp9F/giphy.gif">
                    </div>`
        );
    });
}

function handleStart(e) {
    $(this).css({ opacity: 1.0, visibility: "visible" }).animate({ opacity: 0 }, 200);
    $("#dad-form").addClass("slide-from-left");
}

function runApp(){
     $form.on("submit", handleSubmit)
    $("nav a").on("click", (event) => {
        $(event.target).addClass("active");
        $("nav a").not(event.target).removeClass("active");
    })
    $("#start-btn").on("click", handleStart);
}

$(runApp);
