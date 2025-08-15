const canvas = document.getElementsByTagName('canvas')[0];
const exportButton = document.getElementById('export');
const ctx = canvas.getContext('2d');
const width = canvas.width = window.innerWidth;
const height = canvas.height = window.innerHeight;

const camera = localStorage.getItem("camera") ? JSON.parse(localStorage.getItem("camera")) :{
    x: 0,
    y: 0,
    zoom: 0.1,
    vector: {
        x: 0,
        y: 0,
    },
    force: {
        x: 0,
        y: 0,
    },

    speed: 10,
    zoomSpeed: 0.1,
    inercie: 0.1,
}
const mouse = {
    realX: 0,
    realY: 0,
    absoluteX: 0,
    absoluteY: 0,
    click: false,
}
let object = [
    {
        type: "grid",
        color: "white",
        size: 1000,
        step: 10,
        position: {
            x: -500,
            y: -500,
        }
    },
    {
        type: "gateway",
        color: "magenta",
        size: 10,
        position: {
            x: 0,
            y: 0,
        },
        label: "gateway",
    },
    {
        type: "star",
        color: "yellow",
        size: 5,
        position: {
            x: 150,
            y:300
        },
        label: "solar system 1",
    },
    {
        type: "planet",
        color: "blue",
        size: 1,
        position: {
            x: 150,
            y: 310
        },
        label: "planet 1",
        composition: {
        "gaz.O2": 0.2,
        "gaz.CO2": 0.1,
        "gaz.N2": 0.7,
        "ressource.iron": 0.5,
        "ressource.gold": 0.1,
        "ressource.water": 0.4,
        }
    },
    {
        type: "moon",
        color: "grey",
        size: 0.5,
        position: {
            x: 150,
            y: 312
        },
        label: "moon 1",
        composition: {
            "ressource.iron": 0.5,
            "ressource.gold": 0.01,
            "ressource.water": 0.05,
            "ressource.moonstone": 0.44,
        }
    },
]
let TEXTDATA = ""
let offsetDATA = 0;
let debugRect = []
document.addEventListener('keydown', (e) => {
    if (["ArrowUp", "z"].includes(e.key)) {
        camera.force.y -= camera.speed;
    }
    if (["ArrowDown", "s"].includes(e.key)) {
        camera.force.y += camera.speed;
    }
    if (["ArrowLeft", "q"].includes(e.key)) {
        camera.force.x -= camera.speed;
    }
    if (["ArrowRight", "d"].includes(e.key)) {
        camera.force.x += camera.speed;
    }
    if ([" "].includes(e.key)) {
        camera.vector.x = 0;
        camera.vector.y = 0;
        camera.x = 0;
        camera.y = 0;
        camera.zoom = 1;
    }
    localStorage.setItem("camera", JSON.stringify(camera));

});
canvas.addEventListener('mousedown', (e) => {
    mouse.click = true;
});
canvas.addEventListener('mouseup', (e) => {
    mouse.click = false;
});
canvas.addEventListener('mousemove', (e) => {
    mouse.realX = (e.offsetX - width / 2 + camera.x) / camera.zoom;
    mouse.realY = (e.offsetY - height / 2 + camera.y) / camera.zoom;
    mouse.absoluteX = e.offsetX;
    mouse.absoluteY = e.offsetY;   
});
exportButton.addEventListener('click', (e) => {
    const data = JSON.stringify(object)
    const B64Data = btoa(data);
    alert(B64Data);
});
//controle du zoom a la molette
canvas.addEventListener('wheel', (e) => {
    const zoomFactor = -(e.deltaY / 96 * camera.zoomSpeed);
    const newZoom = Math.max(0.001, Math.min(100, camera.zoom * (1 + zoomFactor)));
    const zoomRatio = newZoom / camera.zoom;
    
    camera.x = mouse.absoluteX - (mouse.absoluteX - camera.x) * zoomRatio;
    camera.y = mouse.absoluteY - (mouse.absoluteY - camera.y) * zoomRatio;
    camera.zoom = newZoom;
    localStorage.setItem("camera", JSON.stringify(camera));
});
function updateCamera() {
    camera.x = Math.max(-100000, Math.min(100000, camera.x));
    camera.y = Math.max(-100000, Math.min(100000, camera.y));
    camera.vector.x += camera.force.x;
    camera.vector.y += camera.force.y;
    camera.vector.x -= camera.vector.x * camera.inercie;
    camera.vector.y -= camera.vector.y * camera.inercie;
    camera.x += camera.vector.x;
    camera.y += camera.vector.y;
    camera.force.x = 0;
    camera.force.y = 0;
}
ctx.fillStyle = 'black';
ctx.fillRect(0, 0, width, height);
fetch("universeSetting.json5")
    .then(response => response.text())
    .then(data => {
        data = JSON5.parse(data);
        console.log(data);
        const forbiddenZones = generateUnivert(data);
        function update() {
            TEXTDATA = "\n"
            //met dans le textdata la liste des objets
            let i = 5
            debugRect = []
            object.forEach(obj => {
                if (!["grid", ""].includes(obj.type)) {
                    let text = `${obj.type} : ${obj.label} (${obj.position.x.toFixed(0)}, ${obj.position.y.toFixed(0)})`;
                    TEXTDATA += text + "\n";
                    i++
                    //si je clique sur le text, je zoom sur l'objet
                    //calcule la position du text
                    const y =  i * 20 -7
                    //calcule la taille du text en pixel
                    const fontSize = 15;
                    ctx.font = `${fontSize}px Arial`;
                    const textWidth = ctx.measureText(text).width;
                    const textHeight = fontSize;
                    //si la souris est sur le text
                    //dessine une bordure rouge
                    debugRect.push({x: 0, y: y - textHeight, width: textWidth + 10, height: textHeight});
                    if (mouse.absoluteX > 0 && mouse.absoluteX < textWidth + 10 && mouse.absoluteY > y - textHeight && mouse.absoluteY < y) {
                        if (mouse.click) {
                            camera.x = obj.position.x * camera.zoom;
                            camera.y = obj.position.y * camera.zoom;
                            camera.zoom = 2
                        }
                    }

                }
            });
            TEXTDATA += "\n";
            offsetDATA = 0;
            updateCamera();
            draw();
            if (mouse.click) {
                console.log(TEXTDATA)
            }
            drawTextBox(ctx, `x:${mouse.realX.toFixed(0)} y:${mouse.realY.toFixed(0)}`);
            drawTextBox(ctx, `x:${camera.x.toFixed(0)} y:${camera.y.toFixed(0)}`);
            drawTextBox(ctx, `zoom:${camera.zoom.toFixed(2)}`);
            drawTextBox(ctx, TEXTDATA);
            //dessine les bordures rouges
            ctx.strokeStyle = "red";
            debugRect.forEach(rect => {
                ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
            });
            //dessine les forbiddenZones en bleu
            ctx.strokeStyle = "blue";
            forbiddenZones.forEach(zone => {
                ctx.strokeRect(zone.xMin * camera.zoom + width / 2 - camera.x, zone.yMin * camera.zoom + height / 2 - camera.y, (zone.xMax - zone.xMin) * camera.zoom, (zone.yMax - zone.yMin) * camera.zoom);
            });
            requestAnimationFrame(update);
        }
        update();
    });
    

function draw() {
    //efface le canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    //draw les objets
    object.forEach(obj => {
        switch (obj.type) {
            case "grid":
                drawGrid(obj);
                break;
            case "gateway":
                drawGateway(obj);
                break;
            case "star":
                drawStar(obj);
                break;
            case "planet":
                drawPlanet(obj);
                break;
            case "moon":
                drawMoon(obj);
                break;
            case "circle":
                drawCircle(obj);
                break;
        }
    });
}
function drawGrid(obj) {
    ctx.strokeStyle = obj.color;
    ctx.beginPath();
    for (let x = obj.position.x; x < obj.position.x + obj.size; x += obj.step) {
        ctx.moveTo(x * camera.zoom + width / 2 - camera.x, obj.position.y *
            camera.zoom + height / 2 - camera.y);
        ctx.lineTo(x * camera.zoom + width / 2 - camera.x, obj.position.y *
            camera.zoom + obj.size * camera.zoom + height / 2 - camera.y);
    }
    for (let y = obj.position.y; y < obj.position.y + obj.size; y += obj.step) {
        ctx.moveTo(obj.position.x * camera.zoom + width / 2 - camera.x, y *
            camera.zoom + height / 2 - camera.y);
        ctx.lineTo(obj.position.x * camera.zoom + obj.size * camera.zoom + width / 2 - camera.x, y *
            camera.zoom + height / 2 - camera.y);
    }
    ctx.stroke();
}
function drawGateway(obj) {
    ctx.fillStyle = obj.color;
    ctx.beginPath();
    ctx.arc(obj.position.x * camera.zoom + width / 2 - camera.x, obj.position.y * camera.zoom + height / 2 - camera.y, obj.size * camera.zoom, 0, Math.PI * 2);
    ctx.fill();
    //si la souris est sur l'objet
    if (Math.hypot(mouse.realX - obj.position.x, mouse.realY - obj.position.y) < obj.size) {
        TEXTDATA += "gateway\n";
        TEXTDATA += `x:${obj.position.x.toFixed(0)} y:${obj.position.y.toFixed(0)}\n`;
        TEXTDATA += `Size:${obj.size.toFixed(0)}\n`;
        TEXTDATA += `Label:${obj.label}`;
    }
    drawLabel(obj);

}
function drawStar(obj) {
    ctx.fillStyle = obj.color;
    ctx.beginPath();
    ctx.arc(obj.position.x * camera.zoom + width / 2 - camera.x, obj.position.y * camera.zoom + height / 2 - camera.y, obj.size * camera.zoom, 0, Math.PI * 2);
    ctx.fill();
    //si la souris est sur l'objet
    if (Math.hypot(mouse.realX - obj.position.x, mouse.realY - obj.position.y) < obj.size) {
        TEXTDATA += "star\n";
        TEXTDATA += `x:${obj.position.x.toFixed(0)} y:${obj.position.y.toFixed(0)}\n`;
        TEXTDATA += `Size:${obj.size.toFixed(0)}\n`;
        TEXTDATA += `Label:${obj.label}`;
        if (mouse.click) {
            camera.x = obj.position.x * camera.zoom;
            camera.y = obj.position.y * camera.zoom;
            camera.zoom = 15
        }
    }
    drawLabel(obj);
}
function drawPlanet(obj) {
    drawPlanetDisplay(obj);
    //si la souris est sur l'objet
    if (Math.hypot(mouse.realX - obj.position.x, mouse.realY - obj.position.y) < obj.size) {
        TEXTDATA += "planet\n";
        TEXTDATA += `x:${obj.position.x.toFixed(0)} y:${obj.position.y.toFixed(0)}\n`;
        TEXTDATA += `Size:${obj.size.toFixed(0)}\n`;
        TEXTDATA += `Label:${obj.label}\n`;
        for (const key in obj.composition) {
            TEXTDATA += `${key}:${(obj.composition[key]*100).toFixed(0)}%\n`;
        }
        if (mouse.click) {
            camera.x = obj.position.x * camera.zoom;
            camera.y = obj.position.y * camera.zoom;
            camera.zoom = 25
        }
    }
    drawLabel(obj);
}
function drawMoon(obj) {
    drawPlanet(obj);
}
function drawCircle(obj) {
    ctx.strokeStyle = obj.color;
    ctx.fillStyle = obj.color;
    ctx.beginPath();
    ctx.arc(obj.position.x * camera.zoom + width / 2 - camera.x, obj.position.y *
        camera.zoom + height / 2 - camera.y, obj.size * camera.zoom, 0, Math.PI * 2);
    ctx.stroke();
    // //si la souris est sur l'objet
    // if (Math.hypot(mouse.realX - obj.position.x, mouse.realY - obj.position.y) < obj.size) {
    //     TEXTDATA += "circle\n";
    //     TEXTDATA += `x:${obj.position.x.toFixed(0)} y:${obj.position.y.toFixed(0)}\n`;
    //     TEXTDATA += `Size:${obj.size.toFixed(0)}\n`;
    //     TEXTDATA += `Label:${obj.label}`;
    //     TEXTDATA += "\n";
    //     ctx.fill();
    // }

}




function drawLabel(obj) {
    //calcule la taille du text en pixel
    const fontSize = Math.max(15, obj.size * camera.zoom / 2);
    const padding = 2;
    ctx.font = `${fontSize}px Arial`;
    const text = obj.label;
    const textWidth = ctx.measureText(text).width;
    const textHeight = fontSize;
    //calcule la position du text
    const x = obj.position.x * camera.zoom + width / 2 - camera.x - textWidth / 2;
    //met le text au dessus de l'objet
    const y = obj.position.y * camera.zoom + height / 2 - camera.y - obj.size * camera.zoom - textHeight;
    //dessine un carez noir sous le text
    ctx.fillStyle = "black";
    ctx.fillRect(x-padding, y - textHeight-padding, textWidth+padding*2, textHeight+padding*2);
    //dessine le text
    ctx.fillStyle = "white";
    ctx.fillText(text, x, y);
}

function drawTextBox(ctx, text) {
    const lines = text.split("\n");
    ctx.font = "15px Arial";
    const maxWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
    const y = offsetDATA;
    ctx.fillStyle = "black";
    ctx.fillRect(0, y, maxWidth + 10, lines.length * 20 + 5);

    ctx.fillStyle = "white";

    lines.forEach((line, index) => {
        ctx.fillText(line, 5, y +15 + index * 20);
    });
    offsetDATA += lines.length * 20 + 5;
}

function generateUnivert(universeSetting){
    const universeSize = universeSetting.size.universe;

    object = [
        {
            type: "grid",
            color: "white",
            size: universeSize,
            step: 100,
            position: {
                x: -(universeSize/2),
                y: -(universeSize/2),
            }
        },
        {
            type: "gateway",
            color: "magenta",
            size: 10,
            position: {
                x: 0,
                y: 0,
            },
            label: "gateway",
        }
    ]
    let solarSystemList = []
    let forbiddenZones = [
        {
            xMin: -universeSetting.size.gateway,
            xMax: universeSetting.size.gateway,
            yMin: -universeSetting.size.gateway,
            yMax: universeSetting.size.gateway,
        },
        {
            xMin: -universeSize/2,
            xMax: universeSize/2,
            yMin: -universeSize/2,
            yMax: -universeSize/2+universeSetting.size.border,
        },
        {
            xMin: -universeSize/2,
            xMax: universeSize/2,
            yMin: universeSize/2-universeSetting.size.border,
            yMax: universeSize/2,
        },
        {
            xMin: -universeSize/2,
            xMax: -universeSize/2+universeSetting.size.border,
            yMin: -universeSize/2,
            yMax: universeSize/2,
        },
        {
            xMin: universeSize/2-universeSetting.size.border,
            xMax: universeSize/2,
            yMin: -universeSize/2,
            yMax: universeSize/2,
        },
    ];
    //generate star
    function generateSolarSystem(){
        let star = {
            type: "star",
            color: "yellow",
            size: 50,
            position: getRandomPosition(
                {
                    xMin: -universeSize/2,
                    xMax: universeSize/2, 
                    yMin: -universeSize/2, 
                    yMax: universeSize/2
                }, 
                forbiddenZones
            ),
            label: "solar system "+solarSystemList.length,
        }
        
        const solarSystemSize = Math.random() * (universeSetting.distence.solarSystem.size.max - universeSetting.distence.solarSystem.size.min) + universeSetting.distence.solarSystem.size.min;
        console.log(solarSystemSize);
        object.push({
            type: "circle",
            color: "red",
            size: solarSystemSize,
            position: star.position,
            label: solarSystemSize.toFixed(0),
        });
        object.push({
            type: "circle",
            color: "green",
            size: solarSystemSize*universeSetting.distence.star.habitableZone.max,
            position: star.position,
            label: "habitable zone",
        });
        object.push({
            type: "circle",
            color: "red",
            size: solarSystemSize*universeSetting.distence.star.habitableZone.min,
            position: star.position,
            label: "habitable zone",
        });
        //réserve une zone autour de l'étoile
        forbiddenZones.push({
            xMin: star.position.x - universeSetting.size.solarSystem,
            xMax: star.position.x + universeSetting.size.solarSystem,
            yMin: star.position.y - universeSetting.size.solarSystem,
            yMax: star.position.y + universeSetting.size.solarSystem,
        });
        object.push(star);
        solarSystemList.push(star);
        let solarSystemData = {
            star: star,
            planet: [],
        }
        let forbiddenZonesPlanette = []
        function generatePlanet(composition={},yMin= star.position.y+100, yMax=star.position.y+solarSystemSize){
            let planet = {
                type: "planet",
                color: generateColorComposition(universeSetting, composition),
                size: 10,
                position: {
                    x: star.position.x,
                    y: getRandomWithForbiddenZone(yMin, yMax, forbiddenZonesPlanette),
                },
                label: "solar system "+solarSystemList.length+"-planet "+solarSystemData.planet.length,
                drawRings: Math.random() < universeSetting.distence.planet.ring.probability,
                gases: Object.keys(composition).filter(gas => universeSetting.gaz[gas]),
                composition
            }
            forbiddenZonesPlanette.push({
                min: planet.position.y - getRandom(universeSetting.distence.planet.distance.min, universeSetting.distence.planet.distance.max),
                max: planet.position.y + getRandom(universeSetting.distence.planet.distance.min, universeSetting.distence.planet.distance.max),
            });
            solarSystemData.planet.push(planet);
            object.push(planet);
        }

        //crée une planette habitable
        generatePlanet(generateGasComposition(universeSetting, 5, true),star.position.y + solarSystemSize*universeSetting.distence.star.habitableZone.min, star.position.y + solarSystemSize*universeSetting.distence.star.habitableZone.max);


        //entre 3 et 5 planetes
        let planetNumber = Math.floor(Math.random()*2)+3;
        for (let i = 0; i < planetNumber; i++) {
            generatePlanet(generateGasComposition(universeSetting, 5))
        }
    }
    //entre 3 et 5 systeme solaire
    let solarSystemNumber = Math.floor(Math.random()*3)+3;
    for (let i = 0; i < solarSystemNumber; i++) {
        generateSolarSystem();
    }
    return forbiddenZones;
}


function getRandomPosition(bounds, forbiddenZones) {
    const { xMin, xMax, yMin, yMax } = bounds;
    function isInsideForbiddenZones(x, y) {
        return forbiddenZones.some(zone => 
            x >= zone.xMin && x <= zone.xMax && y >= zone.yMin && y <= zone.yMax
        );
    }
    let i = 0;
    let x, y;
    do {
        x = Math.random() * (xMax - xMin) + xMin;
        y = Math.random() * (yMax - yMin) + yMin;
        x = Math.round(x);
        y = Math.round(y);
        i++;
        if (i > 1000) {
            console.error("impossible de trouver une position");
            location.reload();
            break;
        }
    } while (isInsideForbiddenZones(x, y));

    return { x, y };
}
function getRandom(xMin, xMax) {
    return Math.random() * (xMax - xMin) + xMin
}

function getRandomWithForbiddenZone(min, max, forbiddenZones= []){
    console.log(forbiddenZones,"forbiddenZones", min,"min", max,"max");
    function isInsideForbiddenZones(x) {
        return forbiddenZones.some(zone => 
            x >= zone.min && x <= zone.max
        );
    }
    let i = 0;
    let x
    do {
        x = getRandom(min,max)
        i++;
        if (i > 1000) {
            console.error("impossible de trouver une position");
            //actualise la page
            location.reload();
            break;
        }
    } while (isInsideForbiddenZones(x));

    return x;

}

function generateGasComposition(gasData, maxGases = 3, breathable = false) {
    const gases = Object.keys(gasData.gaz);
    let composition = {};
    
    // Sélectionne un premier gaz aléatoirement
    let selectedGas = gases[Math.floor(Math.random() * gases.length)];
    composition[selectedGas] = 1.0;
    
    for (let i = 1; i < maxGases; i++) {
        let compatibleGases = gases.filter(g => 
            !gasData.gazIncompatibilities[selectedGas]?.includes(g) && 
            !Object.keys(composition).includes(g)
        );
        
        if (compatibleGases.length === 0) break; // Plus de gaz compatibles
        
        let newGas = compatibleGases[Math.floor(Math.random() * compatibleGases.length)];
        composition[newGas] = (Math.random() * 0.5).toFixed(2); // Attribution d'une proportion aléatoire
    }
    
    // Normalisation des proportions
    let total = Object.values(composition).reduce((sum, v) => sum + parseFloat(v), 0);
    Object.keys(composition).forEach(g => composition[g] = (composition[g] / total).toFixed(2));
    
    // Ajuster pour une atmosphère respirable
    if (breathable) {
        composition = { 
            "gaz.O2": 0.21,
            "gaz.N2": 0.78,
            "gaz.co2": 0.01
        };
    }
    
    return composition;
}

function generateColorComposition(universeSetting, composition) {
    let totalWeight = 0;
    let r = 0, g = 0, b = 0, alpha = 0;
    
    for (const gasKey in composition) {
        if (!universeSetting.gaz[gasKey]) continue; // Ignore unknown gases
        
        let gas = universeSetting.gaz[gasKey];
        let weight = composition[gasKey] * gas.opacity;
        totalWeight += weight;
        
        let color = gas.color.match(/#(..)(..)(..)/).slice(1).map(hex => parseInt(hex, 16));
        r += color[0] * weight;
        g += color[1] * weight;
        b += color[2] * weight;
        alpha += gas.opacity * composition[gasKey];
    }
    
    if (totalWeight > 0) {
        r = Math.round(r / totalWeight);
        g = Math.round(g / totalWeight);
        b = Math.round(b / totalWeight);
        alpha = Math.min(1, alpha);
    } else {
        r = g = b = 0;
        alpha = 1;
    }
    
    return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
}

const textureImage = new Image();
const noiseImage = new Image();
textureImage.src = "https://static.vecteezy.com/system/resources/previews/019/922/417/non_2x/transparent-overlay-distressed-grunge-noise-texture-background-png.png"; // petite image avec motifs (marbre, gaz, etc.)
noiseImage.src = "https://www.dreamstime.com/grey-noise-texture-illustration-noise-texture-bacground-available-high-resolution-jpeg-grey-noise-texture-illustration-noise-image116732588";     // bruit noir & blanc en semi-transparence
function drawPlanetDisplay(p) {
    if (!p.gases) {
        p.gases = ["NH3", "CH4", "N2"]
    }
    ctx.save();
    p.x = p.position.x * camera.zoom + width / 2 - camera.x;
    p.y = p.position.y * camera.zoom + height / 2 - camera.y;
    p.radius = p.size * camera.zoom;
    console.log(p);
    console.log(...p.color.match(/\d+/g).slice(0, 3).map(Number))
    p.color = rgbToHex(...p.color.match(/\d+/g).slice(0, 3).map(Number));    // --- Anneau (optionnel) ---
    if (p.drawRings) {
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.radius * 1.5, p.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "#aaa";
        ctx.globalAlpha = 0.2;
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    // --- Glow atmosphérique ---
    const glow = ctx.createRadialGradient(p.x, p.y, p.radius * 0.8, p.x, p.y, p.radius * 1.5);
    console.log(p.color);
    glow.addColorStop(0, p.color+"7F");
    glow.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // --- Dégradé surface ---
    const grad = ctx.createRadialGradient(p.x, p.y, p.radius * 0.2, p.x, p.y, p.radius);
    grad.addColorStop(0, lighten(p.color, 30));
    grad.addColorStop(0.6, p.color);
    grad.addColorStop(1, darken(p.color, 30));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();

    // --- Texture d'image (surface marbrée) ---
    if (textureImage.complete) {
        const pattern = ctx.createPattern(textureImage, "repeat");
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.clip();
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = pattern;
        ctx.fillRect(p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2);
        ctx.restore();
    }

    // --- Bruit (surface vivante) ---
    if (noiseImage.complete) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.clip();
        ctx.globalAlpha = 0.1;
        ctx.drawImage(noiseImage, p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2);
        ctx.restore();
    }



    ctx.restore();
}
// 🎨 Utilitaires couleurs
function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
    };
}

function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function lighten(hex, percent) {
    const { r, g, b } = hexToRgb(hex);
    return rgbToHex(
        Math.min(255, r + percent),
        Math.min(255, g + percent),
        Math.min(255, b + percent)
    );
}

function darken(hex, percent) {
    const { r, g, b } = hexToRgb(hex);
    return rgbToHex(
        Math.max(0, r - percent),
        Math.max(0, g - percent),
        Math.max(0, b - percent)
    );
}