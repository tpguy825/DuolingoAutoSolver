// ==UserScript==
// @name        Duolingo autoSolver
// @namespace   Violentmonkey Scripts
// @match       https://*.duolingo.com/*
// @grant       GM_log
// @version     1.1
// @author      -
// @description 12/21/2020, 6:35:07 PM
// ==/UserScript==

var intervalId;

function addButtons() {
    if (document.getElementById("solveAllButton") !== null) {
        return;
    }

    let original = document.querySelectorAll('[data-test="player-next"]')[0];
    let wrapper = document.getElementById("session/PlayerFooter").children[0].lastChild
    if (original == undefined) {
        let startButton = document.querySelector('[data-test="start-button"]');
        if (startButton == undefined) {
            return;
        }
        let wrapper = startButton.parentNode;
        let autoComplete = document.createElement("a");
        autoComplete.className = startButton.className;
        autoComplete.id = "solveAllButton";
        autoComplete.innerText = "COMPLETE SKILL";
        autoComplete.removeAttribute("href");
        autoComplete.onclick = function () {
            startSolving();
            setInterval(function () {
                let startButton = document.querySelector('[data-test="start-button"]');
                if (startButton && startButton.innerText.startsWith("START")) {
                    startButton.click();
                }
            }, 3000);
            startButton.click();
        };
        wrapper.appendChild(autoComplete);
    } else {
        wrapper.style.display = "flex";

        let solveCopy = document.createElement("button");
        let pauseCopy = document.createElement("button");

        solveCopy.id = "solveAllButton";
        if (intervalId) {
            solveCopy.innerHTML = "PAUSE SOLVE";
        } else {
            solveCopy.innerHTML = "SOLVE ALL";
        }
        solveCopy.disabled = false;
        pauseCopy.innerHTML = "SOLVE";

        const buttonStyle = `
            min-width: 150px;
            font-size: 17px;
            border:none;
            border-bottom: 4px solid #58a700;
            border-radius: 18px;
            padding: 13px 16px;
            transform: translateZ(0);
            transition: filter .2s;
            font-weight: 700;
            letter-spacing: .8px;
            background: #55CD2E;
            color:#fff;
            margin-left:20px;
            cursor:pointer;
        `;

        solveCopy.style.cssText = buttonStyle;
        pauseCopy.style.cssText = buttonStyle;

        //Hover effect for buttons

        function mouseOver(x) {
            x.style.filter = "brightness(1.1)";
        }

        function mouseLeave(x) {
            x.style.filter = "none";
        }

        let buttons = [solveCopy, pauseCopy];

        buttons.forEach((button) => {
            button.addEventListener("mousemove", () => {
                mouseOver(button);
            });
        });

        buttons.forEach((button) => {
            button.addEventListener("mouseleave", () => {
                mouseLeave(button);
            });
        });

        original.parentElement.appendChild(pauseCopy);
        original.parentElement.appendChild(solveCopy);

        solveCopy.addEventListener("click", solving);
        pauseCopy.addEventListener("click", solve);
    }
}

setInterval(addButtons, 1000);

function solving() {
    if (intervalId) {
        pauseSolving();
    } else {
        startSolving();
    }
}

function startSolving() {
    if (intervalId) {
        return;
    }
    document.getElementById("solveAllButton").innerText = "PAUSE SOLVE";
    intervalId = setInterval(solve, 500);
}

function pauseSolving() {
    if (!intervalId) {
        return;
    }
    document.getElementById("solveAllButton").innerText = "SOLVE ALL";
    clearInterval(intervalId);
    intervalId = undefined;
}

let sol = null;

function solve() {
    try {
        sol = FindReact( document.getElementById("session/PlayerFooter").parentElement.parentElement.parentElement.children[1]).props.currentChallenge;

        sol = sol
        console.log(sol)
        //        const acc = Object.entries(sol).map(([k, v]) => {
        //            if (previoussol[k] == v) return 1;
        //            return 0;
        //        });
        //        if (acc.reduce((a, b) => a + b) / acc.length > 0.9) throw new Error("encouragement screen detected");
        //        previoussol = sol;
    } catch (e) {
        let next = document.querySelector('[data-test="player-next"]');
        if (next) {
            next.click();
        }
        console.log(e);
        //return;
    }
    if (!sol) {
        console.log("no sol")
        return;
    }
    let btn = null;

    let selNext = document.querySelectorAll('[data-test="player-next"]');
    let selAgain = document.getElementsByClassName(
        "_3_pD1 _2ESN4 _2arQ0 _2vmUZ _2Zh2S _1X3l0 eJd0I _3yrdh _2wXoR _1AM95 _1dlWz _2gnHr _2L5kw _3Ry1f",
    );

    if (selAgain.length === 1) {
        // Make sure it's the `practice again` button
        if (selAgain[0].innerHTML.toLowerCase() === "practice again") {
            // Click the `practice again` button
            selAgain[0].click();

            // Terminate
            return;
        }
    }

    if (selNext.length === 1) {
        // Save the button element
        btn = selNext[0];

        if (document.querySelectorAll('[data-test="challenge-choice"]').length > 0) {
            if (sol.correctIndices) {
                sol.correctIndices.forEach((index) => {
                    document.querySelectorAll('[data-test="challenge-choice"]')[index].children[0].click();
                });
                // Click the first element
            } else if (sol.articles) {
                var article = "";
                for (var i = 0; i < sol.articles.length; i++) {
                    if (sol.correctSolutions[0].startsWith(sol.articles[i])) {
                        Array.from(document.querySelectorAll('[data-test="challenge-choice"]'))
                            .find(
                            (elm) =>
                            elm.querySelector('[data-test="challenge-judge-text"]').innerText ==
                            sol.articles[i],
                        )
                            .click();
                        article = sol.articles[i];
                        break;
                    }
                }
                let elm = document.querySelectorAll('[data-test="challenge-text-input"]')[0];
                let nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                    window.HTMLInputElement.prototype,
                    "value",
                ).set;
                nativeInputValueSetter.call(
                    elm,
                    sol.correctSolutions
                    ? sol.correctSolutions[0].replace(article + " ", "")
                    : sol.displayTokens
                    ? sol.displayTokens.find((t) => t.isBlank).text
                    : sol.prompt,
                );
                let inputEvent = new Event("input", {
                    bubbles: true,
                });

                elm.dispatchEvent(inputEvent);
            } else {
                document.querySelectorAll('[data-test="challenge-choice"]')[sol.correctIndex].click();
            }
            // Click the solve button
            btn.click();
        }

        if (document.querySelectorAll('[data-test="challenge-choice-card"]').length > 0) {
            // Click the first element
            if (sol.correctIndices) {
                sol.correctIndices.forEach((index) => {
                    document.querySelectorAll('[data-test="challenge-choice-card"]')[index].children[0].click();
                });
            } else {
                document.querySelectorAll('[data-test="challenge-choice-card"]')[sol.correctIndex].click();
            }
            // Click the solve button
            btn.click();
        }

        if (sol.type == "tapComplete") {
            const bank = document.querySelector('[data-test="word-bank"]');
            const options = Array.from(bank.querySelectorAll("div")).map((op) =>
                                                                         op.querySelector("span > button"),
                                                                        );
            const correct = sol.correctIndices;
            function click(answer) {
                console.log(
                    options.map((e) => e.innerText),
                    sol.choices[answer].text,
                );
                for (let i = 0; i < options.length; i++) {
                    const item = options[i];
                    if (item.innerText == sol.choices[answer].text) {
                        if (item.click) item.click();
                        options.splice(i, 1);
                        //break; // Assuming you want to exit the loop after finding and clicking the item
                    }
                }

            }
            for (let i = 0; i < correct.length; i++) {
                setTimeout(() => click(correct[i]), 50 * i);
            }
        }

        if (sol.type == "listenMatch") {
            let nl = document.querySelectorAll('[data-test="new-challenge-tap-token"]');
            sol.pairs.forEach((pair) => {
                for (let i = 0; i < nl.length; i++) {
                    let nlInnerText;
                    if (nl[i].querySelectorAll('[data-test="challenge-tap-token-text"]').length > 1) {
                        nlInnerText = nl[i]
                            .querySelector('[data-test="challenge-tap-token-text"]')
                            .innerText.toLowerCase()
                            .trim();
                    } else {
                        try {
                            nlInnerText = FindSubReact(nl[i]).text.toLowerCase().trim();
                        } catch {}
                    }
                    if (
                        (nlInnerText == pair.learningWord.toLowerCase().trim() ||
                         nlInnerText == pair.translation.toLowerCase().trim()) &&
                        !nl[i].disabled
                    ) {
                        nl[i].click();
                    }
                }
            });
        }

        if (sol.type == "translate") {
            const bank = document.querySelector('[data-test="word-bank"]');
            if (bank) {
                console.log("translate, with bank", { bank, sol })
                const options = Array.from(bank.querySelectorAll("div")).map((op) =>
                                                                             op.querySelector("span > button"),
                                                                            );
                console.log("options", options)
                const correct = sol.correctTokens;
                function click(answer) {
                    for (let i = 0; i < options.length; i++) {
                        const item = options[i];
                        if (item.innerText == answer) {
                            if (item.click) item.click();
                            options.splice(i, 1);
                            break; // Assuming you want to exit the loop after finding and clicking the item
                        }
                    }
                }
                for (let i = 0; i < correct.length + 1; i++) {
                    if (i == correct.length) setTimeout(() => btn.click(), 50 * i);
                    setTimeout(() => click(correct[i]), 25 * i);
                }
            } else {
                let elm = document.querySelectorAll('textarea[autocomplete="off"]')[0];

                let nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                    window.HTMLTextAreaElement.prototype,
                    "value",
                ).set;
                nativeInputValueSetter.call(
                    elm,
                    sol.correctSolutions ? sol.correctSolutions[0] : sol.prompt,
                );

                let inputEvent = new Event("input", {
                    bubbles: true,
                });

                elm.dispatchEvent(inputEvent);
            }
        }

        if (sol.type == "listenSpell") {
            let tokens = sol.displayTokens.filter((x) => x.damageStart !== undefined);
            let elms = document.querySelectorAll("._2cjP3._2IKiF");
            let nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype,
                "value",
            ).set;

            var solutionCharacters = [];
            for (let tok of tokens) {
                for (let i = tok.damageStart; i < tok.damageEnd; i++) {
                    solutionCharacters.push(tok.text[i]);
                }
            }

            for (var elmIndex = 0; elmIndex < elms.length; elmIndex++) {
                nativeInputValueSetter.call(elms[elmIndex], solutionCharacters[elmIndex]);

                let inputEvent = new Event("input", {
                    bubbles: true,
                });

                elms[elmIndex].dispatchEvent(inputEvent);
            }
        }

        if (sol.type == "listenTap") {
            let usekeyboard = document.querySelector('button[data-test="player-toggle-keyboard"]');
            if (usekeyboard && usekeyboard.querySelector("span").innerText.toLowerCase() == "use keyboard")
                usekeyboard.click();
            let elm = document.querySelector('textarea[autocomplete="off"]');

            window.aaaa = elm;
            let nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLTextAreaElement.prototype,
                "value",
            ).set;
            nativeInputValueSetter.call(
                elm,
                sol.correctSolutions ? sol.correctSolutions[0] : sol.prompt,
            );

            let inputEvent = new Event("input", {
                bubbles: true,
            });

            elm.dispatchEvent(inputEvent);
        }

        if (document.querySelectorAll('[data-test$="challenge-tap-token"]').length > 0) {
            // Click the first element
            if (sol.pairs) {
                let nl = document.querySelectorAll('[data-test$="challenge-tap-token"]');
                if (
                    document.querySelectorAll('[data-test$="challenge-tap-token-text"]').length ==
                    document.querySelectorAll('[data-test$="challenge-tap-token"]').length
                ) {
                    sol.pairs.forEach((pair) => {
                        for (let i = 0; i < nl.length; i++) {
                            const nlInnerText = nl[i]
                            .querySelector('[data-test$="challenge-tap-token-text"]')
                            .innerText.toLowerCase()
                            .trim();
                            if (
                                (nlInnerText == pair.learningToken.toLowerCase().trim() ||
                                 nlInnerText == pair.fromToken.toLowerCase().trim()) &&
                                !nl[i].disabled
                            ) {
                                nl[i].click();
                            }
                        }
                    });
                }
            } else {
                try {
                    let clicked = {};
                    let nl = document.querySelectorAll('[data-test$="challenge-tap-token"]');
                    sol.correctIndices.forEach((index) => {
                        let choices = (i) =>
                        sol.correctTokens ? sol.correctTokens[i] : sol.choices[i].text;
                        let correctAnswer = choices(index);
                        for (let i = 0; i < nl.length; i++) {
                            if (
                                nl[i].innerText.toLowerCase().trim() == correctAnswer.toLowerCase().trim() &&
                                !nl[i].ariaDisabled &&
                                !clicked[i]
                            ) {
                                clicked[i] = 1;
                                nl[i].click();
                                break;
                            }
                        }
                    });
                } catch (e) {}
            }
            // Click the solve button
            btn.click();
        }

        if (document.querySelectorAll('[data-test="challenge-text-input"]').length > 0) {
            let elm = document.querySelectorAll('[data-test="challenge-text-input"]')[0];
            let nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype,
                "value",
            ).set;
            nativeInputValueSetter.call(
                elm,
                sol.correctSolutions
                ? sol.correctSolutions[0]
                : sol.displayTokens
                ? sol.displayTokens.find((t) => t.isBlank).text
                : sol.prompt,
            );
            let inputEvent = new Event("input", {
                bubbles: true,
            });

            elm.dispatchEvent(inputEvent);
        }

        if (document.querySelectorAll("textarea").length > 0) {
            let elm = document.querySelector("textarea");

            let nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLTextAreaElement.prototype,
                "value",
            ).set;
            nativeInputValueSetter.call(
                elm,
                sol.correctSolutions ? sol.correctSolutions[0] : sol.prompt,
            );

            let inputEvent = new Event("input", {
                bubbles: true,
            });

            elm.dispatchEvent(inputEvent);
        }

        if (sol.type == "partial_reverse_translate" || sol.type == "partialReverseTranslate") {
            btn.click()
            const totype = sol.displayTokens
            .filter((t) => t.isBlank)
            .map((t) => t.text)
            .join("");
            const div = document.querySelector('[data-test="challenge challenge-partialReverseTranslate"]');
            const span = div.querySelector("span[contenteditable]");
            span.innerText = totype
            const inputspan = div.querySelector("label > span[style]");
            //inputspan.innerText = totype
            span.click()
            function type(span) {
                totype.split("").forEach((v) => {
                    span.dispatchEvent(
                        new KeyboardEvent("keydown", {
                            key: v,
                            keyCode: v.charCodeAt(),
                        }),
                    );
                });
            }
            type(span);
            inputspan.click()
            type(inputspan);
            let inputEvent = new Event("keydown", {
                bubbles: true,
            });

            span.dispatchEvent(inputEvent);
            inputspan.dispatchEvent(inputEvent);
            console.log("Press space!!");
        }

        // Continue
        btn.click();
    }
}

function FindSubReact(dom, traverseUp = 0) {
    const key = Object.keys(dom).find((key) => key.startsWith("__reactProps$"));
    return dom.parentElement[key].children.props;
}

function FindReact(dom, traverseUp = 0) {
    const key = Object.keys(dom.parentElement).find((key) => key.startsWith("__reactProps$"));
    return dom.parentElement[key].children[0].props.children._owner.stateNode;
}

window.findReact = FindReact;

window.ss = startSolving;
