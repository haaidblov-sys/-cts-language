function replaceAllVars(t, LV, LVN) {
    for (let M = 0; M < LVN.length; M++) if (!Array.isArray(LV[M])) t = t.split(LVN[M]).join(LV[M]);
    for (let S = 0; S < LVN.length; S++) if (Array.isArray(LV[S])) {
        let n = LVN[S].slice(1, -1);
        for (let i = 0; i < LV[S].length; i++) t = t.replaceAll("<" + n + "[" + i + "]>", LV[S][i]);
    }
    for (let D = 0; D < LVN.length; D++) if (Array.isArray(LV[D])) t = t.replaceAll(LVN[D], LV[D].join(", "));
    t = evalMath(t);
    return t;
}
function evalMath(t) {
  // Find every [ Math ... ] and replace with the calculated result
  return t.replace(/\[\s*Math\s+([^\]]+)\]/g, function(match, expr) {
    try {
      // Only allow numbers, spaces, + - * / ( ) . %
      let safe = expr.replace(/[^0-9+\-*/() .%]/g, "");
      if (safe.trim() === "") return match;
      let result = Function("return (" + safe + ")")();
      return result;
    } catch (e) {
      return "[MathError]";
    }
  });
}
function escapeHTML(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function RunCTS(script) {
    let Lines = script.split("\n");
    let MainOP = "";
    let AllBugs = "";
    let LV = [];
    let LVN = [];
    let AllImages = [];
    let NewTitle = null;
    let NewColor = null;
    let VER = "CTS-WebCoder v2.0";

    for (let i = 0; i < Lines.length; i++) {
        let L = Lines[i].trim();

        if (L.startsWith("Say {")) {
            if (L.includes("{") && L.includes("}")) {
                let o = L.substring(L.indexOf("{") + 1, L.lastIndexOf("}")).trim();
                o = replaceAllVars(o, LV, LVN).replace(/"/g, "");
                MainOP += escapeHTML(o) + "<br>";
            } else AllBugs += "Line " + (i + 1) + ": Say: Missing braces<br>";
        }

        else if (L.startsWith("Debug {")) {
            if (L.includes("{") && L.includes("}")) {
                let o = L.substring(L.indexOf("{") + 1, L.lastIndexOf("}")).trim();
                console.log(replaceAllVars(o, LV, LVN).replace(/"/g, ""));
            }
        }

        else if (L.startsWith("Size {")) {
            if (L.includes("{") && L.includes("}")) {
                let n = L.substring(L.indexOf('"') + 1, L.indexOf('"', L.indexOf('"') + 1)).trim();
                let p = LVN.indexOf("<" + n + ">");
                if (p === -1) AllBugs += "Line " + (i + 1) + ": Size: Array not found<br>";
                else if (!Array.isArray(LV[p])) AllBugs += "Line " + (i + 1) + ": Size: Not an array<br>";
                else {
                    let len = LV[p].length - 1;
                    let rp = LVN.indexOf("<Length>");
                    if (rp !== -1) LV[rp] = len;
                    else { LVN.push("<Length>"); LV.push(len); }
                }
            }
        }

        else if (L.startsWith("Title {")) {
            if (L.includes("{") && L.includes("}")) {
                let o = L.substring(L.indexOf("{") + 1, L.lastIndexOf("}")).trim();
                NewTitle = replaceAllVars(o, LV, LVN).replace(/"/g, "");
            }
        }

        else if (L.startsWith("Paint {")) {
            if (L.includes("{") && L.includes("}")) {
                let c = L.substring(L.indexOf("{") + 1, L.lastIndexOf("}")).trim();
                c = replaceAllVars(c, LV, LVN).replace(/"/g, "");
                if (c.includes("/")) {
                    let p = c.split("/").map(s => Number(s.trim()));
                    if (p.length === 3 && !p.some(isNaN)) NewColor = "rgb(" + p[0] + "," + p[1] + "," + p[2] + ")";
                } else NewColor = c;
            }
        }

        else if (L.startsWith("Make {")) {
            if (L.includes("{") && L.includes("}")) {
                let nS = L.indexOf('"') + 1;
                let n = L.substring(nS, L.indexOf('"', nS)).replace(/"/g, "").trim();
                if (LVN.includes("<" + n + ">")) AllBugs += "Line " + (i + 1) + ": Make: Duplicate name<br>";
                else if (L.includes("VarValue [")) {
                    let vS = L.indexOf("VarValue [") + 10;
                    let vE = L.lastIndexOf("]");
                    let v = L.substring(vS, vE).replace(/"/g, "").trim();
                    LVN.push("<" + n + ">");
                    LV.push(replaceAllVars(v, LV, LVN));
                } else if (L.includes("VarType [Array]")) {
                    LVN.push("<" + n + ">");
                    LV.push([]);
                } else AllBugs += "Line " + (i + 1) + ": Make: Missing VarValue/VarType<br>";
            }
        }

        else if (L.startsWith("Push {")) {
            if (L.includes("Value [") && L.includes("]")) {
                let aS = L.indexOf('"') + 1;
                let aN = L.substring(aS, L.indexOf('"', aS)).trim();
                let vS = L.indexOf("Value [") + 7;
                let vE = L.lastIndexOf("]");
                let v = L.substring(vS, vE).replace(/"/g, "").trim();
                let p = LVN.indexOf("<" + aN + ">");
                if (p === -1) AllBugs += "Line " + (i + 1) + ": Push: Array not found<br>";
                else if (!Array.isArray(LV[p])) AllBugs += "Line " + (i + 1) + ": Push: Not an array<br>";
                else LV[p].push(v);
            }
        }

        else if (L.startsWith("Set {")) {
            if (L.includes(" Value [") && L.includes("]")) {
                let nS = L.indexOf('"') + 1;
                let n = L.substring(nS, L.indexOf('"', nS)).trim();
                let vS = L.indexOf("[") + 1;
                let vE = L.lastIndexOf("]");
                let v = L.substring(vS, vE).replace(/"/g, "").trim();
                let p = LVN.indexOf("<" + n + ">");
                if (p !== -1) LV[p] = replaceAllVars(v, LV, LVN);
                else AllBugs += "Line " + (i + 1) + ": Set: Variable not found<br>";
            }
        }
else if (L.startsWith("Calc {")) {
    if (L.includes("{") && L.includes("}")) {
        let m = L.substring(L.indexOf("{") + 1, L.lastIndexOf("}")).trim();
        m = replaceAllVars(m, LV, LVN);
        
        // Let evalMath handle it (supports multiple operators)
        let resultStr = evalMath("[ Math " + m + " ]");
        let r = Number(resultStr);
        
        if (isNaN(r)) {
            AllBugs += "Line " + (i + 1) + ": Calc: Bad math (" + m + ")<br>";
        } else {
            let p = LVN.indexOf("<Result>");
            if (p !== -1) LV[p] = r;
            else { LVN.push("<Result>"); LV.push(r); }
        }
    } else AllBugs += "Line " + (i + 1) + ": Calc: Missing braces<br>";
}
        

        else if (L.startsWith("Repeat {")) {
            if (L.includes("{") && L.includes("}")) {
                let n = L.substring(L.indexOf("{") + 1, L.lastIndexOf("}")).trim();
                n = replaceAllVars(n, LV, LVN);
                let count = Number(n);
                let end = -1;
                if (count <= 2000 && !isNaN(count)) {
                    for (let j = i + 1; j < Lines.length; j++) if (Lines[j].trim() === "End") { end = j; break; }
                    if (end !== -1) {
                        let body = Lines.slice(i + 1, end);
                        let rep = [];
                        for (let r = 0; r < count; r++) rep = rep.concat(body);
                        Lines.splice(i, end - i + 1, ...rep);
                        i = i - 1;
                    } else AllBugs += "Line " + (i + 1) + ": Repeat: Missing End<br>";
                } else AllBugs += "Line " + (i + 1) + ": Repeat: Bad count<br>";
            }
        }

        else if (L.startsWith("Roll {")) {
            if (L.includes("To")) {
                let fO = L.indexOf("{");
                let fC = L.indexOf("}", fO);
                let minS = L.substring(fO + 1, fC).trim();
                let tP = L.indexOf("To", fC);
                let sO = L.indexOf("{", tP);
                let sC = L.indexOf("}", sO);
                let maxS = L.substring(sO + 1, sC).trim();
                minS = replaceAllVars(minS, LV, LVN);
                maxS = replaceAllVars(maxS, LV, LVN);
                let mn = Number(minS), mx = Number(maxS);
                if (isNaN(mn) || isNaN(mx)) AllBugs += "Line " + (i + 1) + ": Roll: Bad min/max<br>";
                else {
                    let rnd = Math.floor(Math.random() * (mx - mn + 1)) + mn;
                    let p = LVN.indexOf("<Roll>");
                    if (p !== -1) LV[p] = rnd;
                    else { LVN.push("<Roll>"); LV.push(rnd); }
                }
            }
        }

        else if (L.startsWith("Save {")) {
            if (L.includes("Value [") && L.includes("]")) {
                let kS = L.indexOf('"') + 1;
                let k = L.substring(kS, L.indexOf('"', kS)).trim();
                let vS = L.indexOf("Value [") + 7;
                let vE = L.lastIndexOf("]");
                let v = L.substring(vS, vE).replace(/"/g, "").trim();
                localStorage.setItem("CTS_" + k, replaceAllVars(v, LV, LVN));
            }
        }

        else if (L.startsWith("Load {")) {
            if (L.includes("{") && L.includes("}")) {
                let kS = L.indexOf('"') + 1;
                let k = L.substring(kS, L.indexOf('"', kS)).trim();
                let s = localStorage.getItem("CTS_" + k);
                if (s === null) s = "0";
                let p = LVN.indexOf("<Loaded>");
                if (p !== -1) LV[p] = s;
                else { LVN.push("<Loaded>"); LV.push(s); }
            }
        }

        else if (L.startsWith("Wipe {")) {
            localStorage.clear();
            MainOP += "All data wiped.<br>";
        }

        else if (L.startsWith("Jump [")) {
            let tS = L.indexOf("[") + 1;
            let tE = L.lastIndexOf("]");
            let n = Number(L.substring(tS, tE).trim());
            if (!isNaN(n) && n > i && n < Lines.length) i = n - 1;
        }

        else if (L.startsWith("Show {")) {
            if (L.includes("{") && L.includes("}")) {
                let u = L.substring(L.indexOf("{") + 1, L.lastIndexOf("}")).trim();
                AllImages.push(replaceAllVars(u, LV, LVN).replace(/"/g, "").trim());
            }
        }

        else if (L.startsWith("When {") || L.startsWith("Or {") || L.startsWith("Otherwise") || L.startsWith("Done")) {
            let branches = [];
            let depth = 0;
            let endIdx = -1;
            let firstCond = L.substring(L.indexOf("{") + 1, L.lastIndexOf("}")).trim();
            branches.push({ type: "when", line: i, cond: firstCond });

            for (let j = i + 1; j < Lines.length; j++) {
                let t = Lines[j].trim();
                if (t.startsWith("When {")) depth++;
                else if (t.startsWith("Done")) {
                    if (depth === 0) { endIdx = j; break; } else depth--;
                }
                else if (depth === 0 && t.startsWith("Or {")) {
                    branches.push({ type: "or", line: j, cond: t.substring(t.indexOf("{") + 1, t.lastIndexOf("}")).trim() });
                }
                else if (depth === 0 && t === "Otherwise") {
                    branches.push({ type: "else", line: j, cond: null });
                }
            }

            if (endIdx === -1) AllBugs += "Line " + (i + 1) + ": When: Missing Done<br>";
            else {
                let chosenS = -1, chosenE = -1;
                for (let b = 0; b < branches.length; b++) {
                    let br = branches[b];
                    if (br.type === "else") { chosenS = br.line + 1; chosenE = endIdx; break; }
                    let c = replaceAllVars(br.cond, LV, LVN).replace(/"/g, "").trim();
                    let res = false;
                    if (c.includes(">=")) { let p = c.split(">="); res = Number(p[0].trim()) >= Number(p[1].trim()); }
                    else if (c.includes("<=")) { let p = c.split("<="); res = Number(p[0].trim()) <= Number(p[1].trim()); }
                    else if (c.includes("==")) { let p = c.split("=="); res = p[0].trim() === p[1].trim(); }
                    else if (c.includes("!=")) { let p = c.split("!="); res = p[0].trim() !== p[1].trim(); }
                    else if (c.includes(">")) { let p = c.split(">"); res = Number(p[0].trim()) > Number(p[1].trim()); }
                    else if (c.includes("<")) { let p = c.split("<"); res = Number(p[0].trim()) < Number(p[1].trim()); }
                    if (res) {
                        let nextLine = (b + 1 < branches.length) ? branches[b + 1].line : endIdx;
                        chosenS = br.line + 1;
                        chosenE = nextLine;
                        break;
                    }
                }
                let body = (chosenS === -1) ? [] : Lines.slice(chosenS, chosenE);
                Lines.splice(i, endIdx - i + 1, ...body);
                i = i - 1;
            }
        }
    }

    let plain = MainOP.replace(/<br>/g, "\n");
    return {
        output: AllBugs + MainOP + "<br>-----------<br>" + (plain.length - 1) + "<br>" + VER + "<br>Thats it!",
        images: AllImages,
        title: NewTitle,
        color: NewColor,
        raw: MainOP
    };
} 
