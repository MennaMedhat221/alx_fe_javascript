const quoteDisplay = document.getElementById('quoteDisplay');
const btn = document.getElementById('newQuote');
const qoutes = [
    {
        text: "The greatest glory in living lies not in never falling, but in rising every time we fall.",
        category: "Motivation"
    },
    {
        text: "The way to get started is to quit talking and begin doing.",
        category: "Motivation",
    },
    {
        text: "If life were predictable it would cease to be life, and be without flavor.",
        category: "Motivation"
    },
    {
        text: "Life is what happens when you're busy making other plans.",
        category: "Motivation"
    }
]

function showRandomQuote(){
    const num = Math.random();
    const max = qoutes.length
    const index = Math.floor(num * max);
    const quote = qoutes[index];
    quoteDisplay.innerHTML = quote.text;
}
btn.addEventListener('click', showRandomQuote);
