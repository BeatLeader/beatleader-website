export function playersTitle(tag) {
    switch (tag) {
        case "DUH": return "prayer";
        case "JML": return "jamal";
    
        default: return "player";
    }    
}

export function rankLabel(tag) {
    switch (tag) {
        case "JML": return "Jamal";
    
        default: return "Average Rank";
    }    
}

export function accLabel(tag) {
    switch (tag) {
        case "JML": return "Jamal";
    
        default: return "Average Acc";
    }    
}

export function ppLabel(tag) {
    switch (tag) {
        case "JML": return "Jamal";
    
        default: return "Total PP";
    }    
}

const clansChangingValues = ["WYSI"];

export function changingValuesClan(clans) {
    return clans.find(element => clansChangingValues.includes(element.tag))?.tag;
}

export function rankValue(tag, value) {
    switch (tag) {
        case "WYSI": return 727;
    
        default: return value;
    }    
}

export function accValue(tag, value) {
    switch (tag) {
        case "WYSI": return 96.41;
    
        default: return value;
    }    
}

export function ppValue(tag, value) {
    switch (tag) {
        case "WYSI": return 727;
    
        default: return value;
    }    
}