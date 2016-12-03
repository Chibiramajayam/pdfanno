require("!style!css!./pdf-annotate.css");
import $ from 'jquery';

// The entry point of window.xxx.
// (setting from webpack.config.js)
import PDFJSAnnotate from './src/PDFJSAnnotate';
export default PDFJSAnnotate;

let PDFAnnotate = PDFJSAnnotate;

window.addEventListener('DOMContentLoaded', function() {

    // Setup Storage.
    PDFAnnotate.setStoreAdapter(new PDFAnnotate.PdfannoStoreAdapter());

    // Settings.
    let textSize = 12;
    let textColor = '#FF0000';
    PDFAnnotate.UI.setText(textSize, textColor);

    window.addEventListener('pagerendered', function(ev) {
        console.log('pagerendered:', ev.detail.pageNumber);

        // Create SVG layer.
        let $textLayer = $(ev.target).find('.textLayer');
        let $svg = $('<svg class="annotationLayer"/>');
        $svg.insertBefore($textLayer);
        let svg = $svg.get(0);

        let documentId = getFileName(PDFView.url);
        let viewport = PDFView.pdfViewer.getPageView(0).viewport;
        svg.setAttribute('data-pdf-annotate-viewport', JSON.stringify(viewport));
        svg.setAttribute('data-pdf-annotate-document', documentId);
        svg.setAttribute('data-pdf-annotate-page', pageNumber);
        svg.setAttribute('width', viewport.width);
        svg.setAttribute('height', viewport.height);
        svg.style.width = `${viewport.width}px`;
        svg.style.height = `${viewport.height}px`;

        // Import user uploading annotation, if exists.
        if (uploadedAnnotationExists()) {
            console.log(ev.detail.pageNumber, 'import user annotation');
            importUploadedAnnotation().then(() => {
                renderAnnotations(svg, ev.detail.pageNumber);
            });
        } else {
            renderAnnotations(svg, ev.detail.pageNumber);
        }
    });

});

function renderAnnotations(svg, pageNumber) {
    let documentId = getFileName(PDFView.url);
    PDFAnnotate.getAnnotations(documentId, pageNumber).then(function(annotations) {

        // Adjust screen scale change.
        let viewport = PDFView.pdfViewer.getPageView(0).viewport;
        svg.setAttribute('data-pdf-annotate-viewport', JSON.stringify(viewport));
        svg.setAttribute('data-pdf-annotate-document', documentId);
        svg.setAttribute('data-pdf-annotate-page', pageNumber);
        svg.setAttribute('width', viewport.width);
        svg.setAttribute('height', viewport.height);
        svg.style.width = `${viewport.width}px`;
        svg.style.height = `${viewport.height}px`;

        PDFAnnotate.render(svg, viewport, annotations);

        var event = document.createEvent('CustomEvent');
        event.initCustomEvent('annotationrendered', true, true, {
          pageNumber: pageNumber
        });
        window.dispatchEvent(event);
    });
}


function uploadedAnnotationExists() {
    let item = localStorage.getItem('_pdfanno_pdfanno_upload');
    return item;
}

function importUploadedAnnotation() {
    let annotations = JSON.parse(localStorage.getItem('_pdfanno_pdfanno_upload'));
    console.log('importUploadedAnnotation:', annotations);
    let promise = PDFAnnotate.getStoreAdapter().importData(annotations).then(() => {
        localStorage.removeItem('_pdfanno_pdfanno_upload');
    });
    return promise;
}