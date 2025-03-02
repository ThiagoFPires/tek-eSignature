<script setup lang="ts">
import PdfViewer from './PdfViewer.vue';
import ESignature from '../signature/ESignature.vue';
import { nextTick, ref } from 'vue';
import { jsPDF } from "jspdf";
import { SignatureCanvas } from '../interactive/SignatureCanvas';
import { ISignatureImage } from '../signature/ISignatureImage';
import { ViewerEvents } from './ViewerEvents';
import axios from 'axios';

defineProps<{
  pdfPath: string;  
}>();

const emit = defineEmits<ViewerEvents>();

const showSignaturePad = ref(false);
const viewerRef = ref();
const isSigned = ref(false);
let signatureCanvas: SignatureCanvas;

function onSaveSignature(signature: ISignatureImage) {
    showSignaturePad.value = false;    
    const lastPageCanvas = viewerRef.value.pagesCanvas[viewerRef.value.pagesCanvas.length - 1];
    signatureCanvas = new SignatureCanvas(lastPageCanvas.width, lastPageCanvas.height, lastPageCanvas.style.width, lastPageCanvas.style.height);
    
    signatureCanvas.get().style.position = 'absolute';
    signatureCanvas.get().style.left = '0';
    signatureCanvas.get().style.top = '0';
    signatureCanvas.get().id = 'signature-canvas';
    lastPageCanvas.parentElement.appendChild(signatureCanvas.get());

    const widthScale =  (signatureCanvas.get().width) / viewerRef.value.viewports.initial.width;
    const heightScale =  (signatureCanvas.get().height) / viewerRef.value.viewports.initial.height;
    const width = signature.width * widthScale;
    const height = signature.height * heightScale;

    // -10 Apenas para descolar do canto direito e inferior...
    signatureCanvas.drawSignature(signature.dataURL, signatureCanvas.width - width - 10 , signatureCanvas.height - height - 10, width, height);

    isSigned.value = true;    
    nextTick(() => window.scrollTo(0, document.body.scrollHeight));
}

async function onSaveSignedPdf() {    
    const pdf = new jsPDF({
        unit: 'pt',
        orientation: viewerRef.value.viewports.default.width > viewerRef.value.viewports.default.height ? 'landscape' : 'portrait',
        format: [viewerRef.value.viewports.default.width, viewerRef.value.viewports.default.height],
        putOnlyUsedFonts: true,
        floatPrecision: 16,
        compress: true,
    });

    viewerRef.value.pagesCanvas.forEach((canvas: HTMLCanvasElement, canvasIndex:  number) => {
        if (canvasIndex > 0) {
            pdf.addPage();
        }
        
        if (canvas.parentElement === signatureCanvas.get().parentElement) {
            
            canvas.getContext('2d')!.drawImage(signatureCanvas.getSignature().img, 
                                                signatureCanvas.getSignature().corners.topLeft.x,
                                                signatureCanvas.getSignature().corners.topLeft.y,
                                                signatureCanvas.getSignature().currentWidth,
                                                signatureCanvas.getSignature().currentHeight);                                                                                                  
            pdf.addImage(canvas.toDataURL('image/jpeg', 0.9), 0, 0, viewerRef.value.viewports.default.width, viewerRef.value.viewports.default.height, '', 'FAST');            
            signatureCanvas.get().remove();                             
        }
        else{
            pdf.addImage(canvas.toDataURL('image/jpeg', 0.9), 0, 0, viewerRef.value.viewports.default.width, viewerRef.value.viewports.default.height, '', 'FAST');                                  
        }
    });

    // Converte o PDF para formato Blob
    const pdfBlob = pdf.output('blob');

    // Cria o FormData para enviar o PDF
    const formData = new FormData();
    formData.append('file', pdfBlob, 'signed_document.pdf');

    try {
        // Envia para a API (substitua 'YOUR_API_URL' pela URL real da sua API)
        const response = await axios.post('http://localhost:4000/s3/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data', // Necessário para envio de arquivos
                // Caso precise de autenticação, adicione o cabeçalho de Authorization
                'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
            },
        });

        console.log('PDF enviado com sucesso:', response.data);
        // Você pode tratar a resposta da API aqui (ex. URL do PDF no S3)
    } catch (error) {
        console.error('Erro ao enviar PDF para a API:', error);
    }
}

function handlePrintPagesError(error: Error) {
    emit('onPrintPagesError', error);
}

function handleOnResize(): void {
    if (!signatureCanvas?.get()) {
        return;
    }    

    const lastPageCanvas: HTMLCanvasElement = viewerRef.value.pagesCanvas[viewerRef.value.pagesCanvas.length - 1];       
    
    // Novo tamanho / Tamanho antigo
    const widthScale = lastPageCanvas.width/signatureCanvas.get().width; 
    const heightScale = lastPageCanvas.height/signatureCanvas.get().height;

    signatureCanvas.get().width = lastPageCanvas.width;
    signatureCanvas.get().height = lastPageCanvas.height;
    signatureCanvas.get().style.width = lastPageCanvas.style.width;
    signatureCanvas.get().style.height = lastPageCanvas.style.height; 
    signatureCanvas.drawSignature(signatureCanvas.getSignature().img.src, 
                                    signatureCanvas.getSignature().corners.topLeft.x * widthScale, 
                                    signatureCanvas.getSignature().corners.topLeft.y * heightScale,
                                    signatureCanvas.getSignature().currentWidth * widthScale,   
                                    signatureCanvas.getSignature().currentHeight * heightScale);                                           
}
</script>

<template>    
    <PdfViewer 
        ref="viewerRef" 
        :pdf-path="pdfPath"
        @on-print-pages-error="handlePrintPagesError"   
        @on-resize="handleOnResize"     
    >
        <template #toolbarButtons>
            <v-btn                 
                icon="mdi-file-sign" 
                variant="text" 
                color="white" 
                density="compact" 
                @click="showSignaturePad = true"
                :disabled="isSigned || viewerRef?.loadingPdfDoc"
            />
            <v-btn                 
                icon="mdi-file-check-outline"
                variant="text"
                color="white"
                density="compact"
                @click="onSaveSignedPdf"
                :disabled="!isSigned || viewerRef?.loadingPdfDoc"
            />
            <v-divider vertical class="mx-1"></v-divider>
        </template>        
    </PdfViewer>
    <v-dialog v-model="showSignaturePad">
        <ESignature
            :width="400"
            :height="100"
            signature-type="svg"
            @on-cancel="showSignaturePad = false"
            @on-save="onSaveSignature" 
        />        
    </v-dialog>    

</template>
