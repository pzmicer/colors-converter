//const XYZ_WHITE = [0.95047, 1, 1.08833];
const XYZ_WHITE = [95.047, 100, 108.883];
    
const INPUT_CMYK = "input_cmyk";
const INPUT_LAB = "input_lab";
const INPUT_RGB = "input_rgb";

const OUTPUT_CMYK = "out_cmyk";
const OUTPUT_LAB = "out_lab";
const OUTPUT_RGB = "out_rgb";

const PALETTE = "palette";

let activeInputId = "input_cmyk";
let out_cmyk, out_lab, out_rgb;

function cmykToRgb(c, m, y, k) {
    let r, g, b;
    r = 255 - ((Math.min(1, c * (1 - k) + k)) * 255);
    g = 255 - ((Math.min(1, m * (1 - k) + k)) * 255);
    b = 255 - ((Math.min(1, y * (1 - k) + k)) * 255);
    return [r, g, b];
}

function rgbToCmyk(r, g, b) {
    if ((r == 0) && (g == 0) && (b == 0)) {
        return [0, 0, 0, 1];
    } else {
        let calcR = 1 - (r / 255),
            calcG = 1 - (g / 255),
            calcB = 1 - (b / 255);

        let k = Math.min(calcR, Math.min(calcG, calcB)),
            c = (calcR - k) / (1 - k),
            m = (calcG - k) / (1 - k),
            y = (calcB - k) / (1 - k);

        return [c, m, y, k];
    }
}

function cmykToLab(c, m, y, k) {
    let rgb = cmykToRgb(c, m, y, k);
    let xyz = rgbToXyz(rgb[0], rgb[1], rgb[2]);
    return xyzToLab(xyz[0], xyz[1], xyz[2]);
}

function labToCmyk(l, a, b) {
    let xyz = labToXyz(l, a, b);
    let rgb = xyzToRgb(xyz[0], xyz[1], xyz[2]);
    return rgbToCmyk(rgb[0], rgb[1], rgb[2]);
}

function rgbToXyz(r, g, b) {
    let [rn, gn, bn] = [r, g, b]
        .map(_ => _ / 255)
        .map((x) => (x > 0.04045) ? Math.pow((x + 0.055) / 1.055, 2.4) : x / 12.92)
        .map(_ => _ * 100);

    let x =  0.4124564 * rn + 0.3575761 * gn + 0.1804375 * bn;
    let y =  0.2126729 * rn + 0.7151522 * gn + 0.0721750 * bn;
    let z =  0.0193339 * rn + 0.1191920 * gn + 0.9503041 * bn;       

    return [x, y, z];
}

function xyzToLab(x, y, z)  {
    let [_x, _y, _z] = [x, y, z].map((v, i) => {
        v = v / XYZ_WHITE[i]
        return v > 0.008856 ? Math.pow(v, 1 / 3) : v * 7.787 + 16 / 116
    });

    let l = 116 * _y - 16;
    let a = 500 * (_x - _y);
    let b = 200 * (_y - _z);

    return [l, a, b];
}   

function labToXyz(l, a, b) {
    function f(x) {
        return Math.pow(x, 3) > 0.008856 ? Math.pow(x, 3) : (x - 16 / 116) / 7.787;
    }

    let x = f(a / 500 + (l + 16)/116) * XYZ_WHITE[0];
    let y = f((l + 16)/116) * XYZ_WHITE[1];
    let z = f((l + 16)/116 - b/200) * XYZ_WHITE[2];

    return [x, y, z];
}

function xyzToRgb(x, y, z) {
    let [_x, _y, _z] = [x, y, z].map(_ => _ / 100);

    let rn =   3.2406 * _x - 1.5372 * _y - 0.4986 * _z;
    let gn =  -0.9689 * _x + 1.8758 * _y + 0.0415 * _z;
    let bn =   0.0557 * _x - 0.2040 * _y + 1.0570 * _z;        
    
    let rgb = [rn, gn, bn]
        .map(x => (x >= 0.0031308) ? 1.055 * Math.pow(x, 1/2.4) - 0.055 : 12.92 * x)
        .map(_ => _ * 255);
    
    return rgb;
}

function labToRgb(l, a, b) {
    let [x, y, z] = labToXyz(l, a, b);
    return xyzToRgb(x, y, z);
}

function rgbToLab(r, g, b) {
    let [x, y, z] = rgbToXyz(r, g, b);
    return xyzToLab(x, y, z);
}

function rgbToHex(rgb) {
    console.log(typeof rgb[0]);
    let [h, e, x] = rgb.map(e => {
        let res = e.toString(16);
        if (res.length < 2) {
            res = "0" + res;
        }
        return res;
    });
    return `#${h}${e}${x}`;
}

function setNewInput(newInputId) {
    document.getElementById(activeInputId).style.display = "none";
    activeInputId = newInputId;
    document.getElementById(activeInputId).style.display = "block";
}

function onSelect() {
    let select = document.getElementById("formats");
    console.log(`${select.selectedIndex}`);
    switch (select.selectedIndex) {
        case 0:
            console.log("It's cmyk!");
            setNewInput(INPUT_CMYK);
            break;
        case 1:
            console.log("It's lab!");
            setNewInput(INPUT_LAB);
            break;
        case 2:
            console.log("It's rgb!");
            setNewInput(INPUT_RGB);
            break;
    };
}

function convert() {
    let c, m, y, k, l, a, b, r, g;
    switch (activeInputId) {
        case INPUT_CMYK:
            c = parseInt(document.getElementById(INPUT_CMYK + "_0").value) / 100;
            m = parseInt(document.getElementById(INPUT_CMYK + "_1").value) / 100;
            y = parseInt(document.getElementById(INPUT_CMYK + "_2").value) / 100;
            k = parseInt(document.getElementById(INPUT_CMYK + "_3").value) / 100;
            
            if (!(c >= 0 && c <= 100) || 
                !(m >= 0 && m <= 100) ||
                !(y >= 0 && y <= 100) ||
                !(k >= 0 && k <= 100)) {
                    alert("Bad value!");
                    return;
                }

            let cmyk = [c, m, y, k];
            out_cmyk = cmyk;
            out_lab = cmykToLab(c, m, y, k);
            out_rgb = cmykToRgb(c, m, y, k);
            break;
        case INPUT_LAB:
            l = parseInt(document.getElementById(INPUT_LAB + "_0").value);
            a = parseInt(document.getElementById(INPUT_LAB + "_1").value);
            b = parseInt(document.getElementById(INPUT_LAB + "_2").value);
            
            if (!(l >=    0 && l <= 100) || 
                !(a >= -128 && a <= 127) ||
                !(b >= -128 && b <= 127)) {
                    alert("Bad value!");
                    return;
                }

            let lab = [l, a, b];
            out_lab = lab;
            out_cmyk = labToCmyk(l, a, b);
            out_rgb = labToRgb(l, a, b);
            break;
        case INPUT_RGB:
            r = parseInt(document.getElementById(INPUT_RGB + "_0").value);
            g = parseInt(document.getElementById(INPUT_RGB + "_1").value);
            b = parseInt(document.getElementById(INPUT_RGB + "_2").value);
            
            if (!(r >= 0 && r <= 255) || 
                !(g >= 0 && g <= 255) ||
                !(b >= 0 && b <= 255)) {
                    alert("Bad value!");
                    return;
                }

            let rgb = [r, g, b];
            out_rgb = rgb;
            out_cmyk = rgbToCmyk(r, g, b);
            out_lab = rgbToLab(r, g, b);
            break;
    }
    setOutput();
}

function setOutput() {
    out_cmyk = out_cmyk.map(e => Math.round(e * 100));
    out_lab = out_lab.map(e => Math.round(e));
    out_rgb = out_rgb.map(e => Math.round(e));

    document.getElementById(OUTPUT_CMYK).value = `cmyk(${out_cmyk[0]}%, ${out_cmyk[1]}%, ${out_cmyk[2]}%, ${out_cmyk[3]}%)`;
    document.getElementById(OUTPUT_LAB).value = `lab(${out_lab[0]}, ${out_lab[1]}, ${out_lab[2]})`;
    document.getElementById(OUTPUT_RGB).value = `rgb(${out_rgb[0]}, ${out_rgb[1]}, ${out_rgb[2]})`;
    document.getElementById(PALETTE).value = rgbToHex(out_rgb);

    for(let i = 0; i < out_cmyk.length; i++) {
        document.getElementById(`${INPUT_CMYK}_${i}`).value = out_cmyk[i];
    }

    for(let i = 0; i < out_lab.length; i++) {
        document.getElementById(`${INPUT_LAB}_${i}`).value = out_lab[i];
    }

    for(let i = 0; i < out_rgb.length; i++) {
        document.getElementById(`${INPUT_RGB}_${i}`).value = out_rgb[i];
    }
}

function onPaletteChange() {
    let [r, g, b] = document.getElementById(PALETTE).value
        .substring(1)
        .match(/.{2}/g)
        .map(_ => parseInt(_, 16));
    
    let rgb = [r, g, b];
    out_rgb = rgb;
    out_cmyk = rgbToCmyk(r, g, b);
    out_lab = rgbToLab(r, g, b);

    setOutput();
}