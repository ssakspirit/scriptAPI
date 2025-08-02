import { world, system } from "@minecraft/server"; 

// 문제 목록 - 복수 정답 지원
const questions = [ 
    { 
        question: "마인크래프트 개발사 이름은?", 
        answers: ["모장", "mojang", "Mojang"] 
    }, 
    { 
        question: "마인크래프트 주인공 이름은?", 
        answers: ["스티브", "steve", "Steve"] 
    }, 
    { 
        question: "지금 보는 유튜브 채널 이름은?", 
        answers: ["스티브코딩", "stevecoding", "SteveCoding"] 
    }, 
    { 
        question: "마인크래프트에서 가장 흔한 블록은?", 
        answers: ["돌", "stone", "Stone", "스톤"] 
    },
    { 
        question: "마인크래프트에서 나무를 자르면 얻는 아이템은?", 
        answers: ["나무", "wood", "Wood", "원목", "로그"] 
    }

    // 추가 문제들을 필요에 따라 이어서 나열, 복수 정답은 배열로 설정

]; 

// 현재 진행 중인 게임 여부를 나타내는 변수 
let isGameActive = false; 

// 현재 진행 중인 문제의 인덱스 
let currentQuestionIndex = 0; 

// 현재 문제의 정보를 저장하는 변수 
let currentQuestion = {}; 

// 플레이어가 맞추기 위해 입력한 메시지를 저장할 변수 
let playerGuess = ""; 

// 게임 시작 함수 
function startGame() { 
    // 게임이 이미 진행 중이라면 종료 
    if (isGameActive) { 
        return; 
    } 

    // 게임 시작 
    isGameActive = true; 
    currentQuestionIndex = 0; 
    askQuestion(); 
} 

// 문제를 플레이어에게 제시하는 함수 
function askQuestion() { 
    // 현재 문제 설정 
    currentQuestion = questions[currentQuestionIndex]; 

    // 플레이어에게 문제 제시 
    world.getPlayers().forEach((player) => { 
        player.sendMessage(currentQuestion.question); 
        world.getDimension("overworld").runCommandAsync(`title @a subtitle ${currentQuestion.question}`) 
        world.getDimension("overworld").runCommandAsync(`title @a title ${currentQuestionIndex + 1}번 문제`) 
    }); 
} 

// 정답 확인 함수 - 복수 정답 지원
function checkAnswer(playerAnswer, correctAnswers) {
    const normalizedPlayerAnswer = playerAnswer.toLowerCase().trim();
    
    for (let answer of correctAnswers) {
        if (normalizedPlayerAnswer === answer.toLowerCase().trim()) {
            return true;
        }
    }
    return false;
}

// 플레이어가 메시지를 입력할 때마다 호출되는 이벤트 핸들러 
world.afterEvents.chatSend.subscribe((event) => { 
    const player = event.sender; 
    const message = event.message; 

    // '시작'이라는 단어가 포함된 경우에 게임 시작 
    if (message === '시작') { 
        startGame(); 
        return; 
    } 

    // 게임이 진행 중이라면 플레이어의 입력을 정답과 비교 
    if (isGameActive) { 
        playerGuess = message.trim(); 

        // 정답이 맞는지 확인 (복수 정답 지원)
        if (checkAnswer(playerGuess, currentQuestion.answers)) { 
            // 맞았을 경우 축하 메시지 전송 
            world.getPlayers().forEach((player) => { 
                player.sendMessage(`정답입니다! 다음 문제로 진행합니다.`); 
            }); 

            // 다음 문제로 이동 
            currentQuestionIndex++; 

            // 모든 문제를 푼 경우에는 게임 종료 
            if (currentQuestionIndex >= questions.length) { 
                world.getPlayers().forEach((player) => { 
                    player.sendMessage(`게임이 종료되었습니다. 수고하셨습니다!`); 
                }); 
                isGameActive = false; 
            } else { 
                // 다음 문제 제시 
                askQuestion(); 
            } 
        } else {
            // 틀렸을 경우 힌트 제공
            world.getPlayers().forEach((player) => { 
                player.sendMessage(`틀렸습니다. 다시 시도해보세요!`); 
            }); 
        }
    } 

    // '종료'가 입력되면 게임 종료 
    if (message.includes('종료')) { 
        isGameActive = false; 
        playerGuess = ""; 
        currentQuestionIndex = 0; 
        world.getPlayers().forEach((player) => { 
            player.sendMessage("게임이 종료되었습니다. 다시 시작하려면 '시작'을 입력하세요."); 
        }); 
    } 
});
출처: https://stevecoding.tistory.com/13 [스티브코딩:티스토리]
