/*const quoteDisplay = document.getElementById('quoteDisplay');
const btn = document.getElementById('newQuote');
const newQuoteText = document.getElementById('newQuoteText');
const newQuoteCategory = document.getElementById('newQuoteCategory');
const quotes = [
    { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Motivation" },
    { text: "Do what you can, with what you have, where you are.", category: "Inspiration" },
    { text: "Act as if what you do makes a difference. It does.", category: "Encouragement" }
  ];

  function showRandomQuote() {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    document.getElementById('quoteDisplay').innerText = `${quotes[randomIndex].text} - ${quotes[randomIndex].category}`;
  }

  function addQuote() {
    const newQuoteText = document.getElementById('newQuoteText').value;
    const newQuoteCategory = document.getElementById('newQuoteCategory').value;
    
    if (newQuoteText && newQuoteCategory) {
      quotes.push({ text: newQuoteText, category: newQuoteCategory });
      document.getElementById('newQuoteText').value = '';
      document.getElementById('newQuoteCategory').value = '';
    }

    const savedQuotes = JSON.parse(localStorage.getItem('qoute'));
    if(savedQuotes) {
        savedQuotes.push({text: newQuoteText, category: newQuoteCategory })
        localStorage.setItem('qoute' ,JSON.stringify(savedQuotes))

    }else {

        localStorage.setItem('qoute' ,JSON.stringify([{text: newQuoteText, category: newQuoteCategory }]))    }
  }
  
  document.getElementById('newQuote').addEventListener('click', showRandomQuote);
  
  // Show an initial quote on load
  showRandomQuote();
*/

//   function bakeCookies(callback) {
//     console.log('baking cookies... ')
//     setTimeout(()=> {
//         callback();

//     }, 2000)
//   }

//  function eatCookies() {
//     console.log('eating cookies ')
//  }
//  bakeCookies(eatCookies)


// function orderPizza(flavor) {
//     console.log('pizza is getting ready')
//     return new Promise((resolve,reject)=> {
//         setTimeout(()=> {
//             let available = Math.random() > 0.3; // 70% chance of success
//             if(available) {
//                 resolve(`Here its your ${flavor} pizza`)
//             }else {
//                 reject(`sorry your ${flavor} is not avaliable`)
//             }
    
    
//         },2000)
       
//     });
   
// }
// orderPizza('chicken Ranch')
// .then((message)=> {
//     console.log(message)
// }).catch((error) => {
//     console.log(error)
// })

function makePasta(type,callback) {
    console.log('Making pasta')
    setTimeout(()=> {
        let pasta = true;
        if(pasta) {
            console.log(`Here is your ${type} pasta`)
            callback('hii')
        }else {
            console.log(`Sorry this not avaliable`)
        }
    },3000)
}

function eatingPasta(jjjjj) {
    console.log('the pasta is delisious ')
    console.log(jjjjj)
}
makePasta('spaghetti' , eatingPasta)