const sortByParser = (options, sortBy) => {
    if (!options.sortBy && sortBy) {
        options["sortBy"] = sortBy;
    } else if (options && options.sortBy && typeof options.sortBy == 'object') {
        let sort = options.sortBy
        options.sortBy = Object.assign(sortBy, sort);
    } else if (options && options.sortBy && typeof options.sortBy == 'string') {
        const isJson = IsJsonString(options.sortBy);
        if (isJson) {
            let sort = JSON.parse(options.sortBy)
            options.sortBy = Object.assign(sortBy, sort);
        } else {
            const sorting = (multiFieldSort(options.sortBy));
            options.sortBy = sorting;
        }
    }
    return options
}

const sortByStringParser = (sortBy) => {
    let options = {}
    if (sortBy.indexOf(":") !== -1) {
        let splitString = sortBy.split(/[x^:]/);
        console.log(splitString);
        // Convert string values to numeric values for MongoDB
        const sortValue = splitString[1].toLowerCase() === 'desc' ? -1 : 1;
        options[splitString[0]] = sortValue;
    } else {

        let index = false;
        if (sortBy.indexOf("+") !== -1) index = false
        if (sortBy.indexOf("-") !== -1) index = true
        let splitString = sortBy.split(/[x^+-]/);
        if (index) options[splitString[1]] = index ? -1 : 1
        else
            options[splitString[0]] = index ? -1 : 1;
    }
    return options
}
const multiFieldSort = (sortBy) => {
    let sorting = {}
    if (sortBy.indexOf(",") != -1) {
        let splitString = sortBy.split(",");
        if (splitString.length > 1) {
            splitString.forEach((item) => {
                let val = sortByStringParser(item);
                console.log(Object.values(val)[0]);
                sorting[Object.keys(val)[0]] = Object.values(val)[0];
            })
        }
    } else {
        sorting = sortByStringParser(sortBy);
    }
    return sorting;
}
const IsJsonString = (str) => {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}
module.exports = sortByParser;