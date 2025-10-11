
let count = 0;
const value = document.getElementById("value");


const decreaseBtn = document.getElementById("decrease");

const resetBtn = document.getElementById("reset");
const increaseBtn = document.getElementById("increase");

increaseBtn.addEventListener("click", function () {
  count++;
  value.textContent = count;
});

decreaseBtn.addEventListener("click", function () {
  count--;
  value.textContent = count;
});

resetBtn.addEventListener("click", function () {
  count = 0;
  value.textContent = count;
});
