import {sendRequestToGPT} from "./menu.js";

// document.addEventListener('DOMContentLoaded', () => {
//     let img = document.querySelector("#inputImage");
//     let container = document.querySelector("#imageInput");
    
//     const updateBorderRadius = () => {
//         if (img.offsetHeight >= 225) {
//             container.style.borderRadius = "10px";
//             img.style.borderRadius = "0";
//         } else {
//             container.style.borderRadius = "0";
//             img.style.borderRadius = "0";
//         }
//     };
    
//     if (img.complete) {
//         updateBorderRadius();
//     } else {
//         img.addEventListener('load', updateBorderRadius);
//     }
    
//     const observer = new ResizeObserver(updateBorderRadius);
//     observer.observe(img);
// });