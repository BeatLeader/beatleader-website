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