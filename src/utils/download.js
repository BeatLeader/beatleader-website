export default (data, filename, type) => {
    const link = document.createElement("a");
    if (link.download === undefined) return false;

    const blob = new Blob([data], {type});

    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return true;
}