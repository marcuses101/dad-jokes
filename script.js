"use strict"
// git pages
const $form = $("#dad-form");
const $topic = $("#topic");
const $results = $("#results");
const dadURL = "https://icanhazdadjoke.com/";
const entitiesURL = `https://language.googleapis.com/v1beta2/documents:analyzeEntities`
const G_API_KEY = 'AIzaSyCeg3qyipDzL4M0oibcrbF_MoepU7iXk3I'
const imageURL = `https://api.cognitive.microsoft.com//bing/v7.0/images/search`
const AZURE_KEY = `dcb174f76ef74c55bd2ced6b4152bae6`
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
    "invention"
]
let searching = false
const jokeHistory = JSON.parse(window.localStorage.getItem("history"), dateReviver) || [];
console.log(jokeHistory)

function dateReviver(key, value) {
    if (key === "date") {
        return new Date(value);
    } else {
        return value;
    }
}

async function handleSubmit(e) {
    try {
        $results.children().first().addClass("slide-to-right");
        if (searching) return;
        searching = true;
        e.preventDefault();
        const topic = $topic.val();
        //fetch random joke text or joke text based on topic.
        let jokeText = topic
            ? await getJokeByTopic(topic)
            : await getRandomJoke()

        if (!jokeText) throw new Error("Could not find Joke")
        const jokeSubject = await processJokeText(jokeText);
        console.log(jokeSubject);
        const imagesData = await getJokeImageData(jokeSubject);
        let jokeImage = await selectAndLoadImage(imagesData);
        while (!jokeImage.htmlElement) {
            jokeImage = await selectAndLoadImage(imagesData);
        }
        displayJoke(jokeText, jokeImage.htmlElement);
        logJokeHistory(jokeText, jokeImage.bingValue, topic)
        searching = false;
    }
    catch (e) {
        searching = false;
        $form[0].reset();
        console.log(e);
        displayError();
    }

}

function displayError() {
    $(".card").addClass("slide-to-right").on("animationend",()=>{
        $results.html(
            `<div class="card slide-from-left">
                <h4>Error: This is not the topic you are looking for</h4>
                <img src="https://media.giphy.com/media/4560Nv2656Gv0Lvp9F/giphy.gif">
            </div>`
        )
    })
}

function formatJoke(string) {
    return string.split(/(?<=[\.\,\!\?])\s/g).join("<br><br>");
}
// Get joke text
async function getJokeByTopic(topic) {
    try {
        const url = `${dadURL}search?term=${encodeURIComponent(topic.trim())}&limit=1`
        console.log(url);
        const initialResponse = await fetch(url, { headers: { "Accept": "application/json" } });
        console.log(initialResponse)
        const initialData = await initialResponse.json();
        if (!initialResponse.ok) throw new Error(initialResponse.status + ": " + initialResponse.statusText)
        console.log(initialData)
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
        displayError();
        console.log(error)
    }
}

async function getRandomJoke() {
    try {
        const response = await fetch(dadURL, { headers: { "Accept": "application/json" } });
        if (!response.ok) throw new Error(response.status + ": " + response.statusText)
        const data = await response.json();
        return data.joke;
    } catch (e) {
        displayError();
        console.log(e);
    }
}

// process joke text extract key words
async function processJokeText(joke) {
    const jokeToSearch = joke.replace(/\n/g, " ")
    console.log("Joke: " + jokeToSearch)
    const body = {
        "document": {
            content: jokeToSearch,
            type: "PLAIN_TEXT"
        },
        "encodingType": "NONE"
    }
    try {
        const response = await fetch(entitiesURL + `?key=${G_API_KEY}`, {
            method: "POST",
            body: JSON.stringify(body)
        })
        if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`)
        const data = await response.json();
        // return if no entities found
        if (data.entities.length === 0) return "dad"
        let index = 0;
        while (excludedSearchTerms.includes(data.entities[index].name)) {
            index++
        }
        const entity = data.entities[index].name;

        if (entity === "girl") return "woman";
        // split two word entity
        return /\s/.test(entity)
            ? entity.split(" ")[0]
            : entity

    } catch (error) {
        displayError();
        console.log(error)
    }

}

// get cheesy images to display with joke
async function getJokeImageData(keyword) {
    const query = `?q=${keyword}&imagetype=clipart`
    const fullURL = imageURL + query;
    console.log(fullURL)
    try {
        const response = await fetch(fullURL, {
            headers: {
                "Ocp-Apim-Subscription-Key": AZURE_KEY
            }
        })
        if (!response.ok) throw new Error(response.status + ": " + response.statusText)
        const data = await response.json();
        return data;
    } catch (error) {
        displayError();
        console.log(error)
    }

}
// return and object containing an <img> and the associated bing result. 
// return false if image fails to load.
function selectAndLoadImage(jokeData) {
    return new Promise((resolve, reject) => {
        const urlIndex = Math.floor(Math.random() * 10)
        const image = document.createElement("img");
        console.log(jokeData.value[urlIndex])
        image.src = jokeData.value[urlIndex].contentUrl;
        console.dir(image)
        if (image.complete) resolve({
            htmlElement: image,
            bingValue: jokeData.value[urlIndex]
        })
        $(image).on("load", () => {
            console.log("image loaded")
            resolve(
                {
                    htmlElement: image,
                    bingValue: jokeData.value[urlIndex]
                }
            )
        })
        $(image).on("error", () => { resolve(false) })
        setTimeout(() => { resolve(false) }, 5000)
    })

}

// display formatted joke and image

function displayJoke(jokeText, image) {

    let $div = $(
        `<div class="card slide-from-left">
            <h4 class="joke-text">${jokeText}</h4>
            <div>
            </div>
        </div>`
        )
        $div.children("div").append(image)
        $results.html($div);
        // timeout wait for render. Ugly solution
}

function removeCard (){

}

// history functions

function logJokeHistory(jokeText, bingResult, searchTerm) {
    const jokeObject = {
        searchTerm: searchTerm,
        text: jokeText,
        thumbnailURL: bingResult.thumbnailUrl,
        url: bingResult.contentUrl,
        date: new Date()
    }
    jokeHistory.push(jokeObject);
    console.log(jokeHistory);
    window.localStorage.setItem("history", JSON.stringify(jokeHistory))
}

function clearHistory() {
    jokeHistory.length = 0;
    window.localStorage.setItem("history", JSON.stringify(jokeHistory))
}

function removeEntryFromHistory(index) {
    console.log(jokeHistory.splice(index, 1));
    window.localStorage.setItem("history", JSON.stringify(jokeHistory))
    return jokeHistory;
}

function handleStart(e){
    $(this).css({opacity: 1.0, visibility: "visible"}).animate({opacity: 0}, 200);
    $("#dad-form").addClass("slide-from-left")
}

$(() => {
    $form.on("submit", handleSubmit)
    $("nav a").on("click", (event)=>{
        $(event.target).addClass("active");
        $("nav a").not(event.target).removeClass("active");
    })
    $("#start-btn").on("click",handleStart)
})
