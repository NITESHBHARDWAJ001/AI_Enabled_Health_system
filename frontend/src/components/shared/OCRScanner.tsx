import { useRef, useState } from "react";
import { ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/store/toastStore";

interface OCRScannerProps {
  label?: string;
  onExtract: (value: number) => void;
}

/**
 * Scans a photo (BP meter, weighing scale, BMI readout) entirely on-device via tesseract.js (WASM)
 * and extracts the first plausible number from the recognized text — no server round-trip.
 */
export function OCRScanner({ label = "Scan a reading", onExtract }: OCRScannerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setScanning(true);
    try {
      const Tesseract = await import("tesseract.js");
      const {
        data: { text },
      } = await Tesseract.recognize(file, "eng");

      const decimalMatch = text.match(/(\d{1,3}\.\d{1,2})/);
      const integerMatch = text.match(/(\d{2,3})/);
      const match = decimalMatch ?? integerMatch;

      if (!match) {
        toast({ title: "Couldn't read a number", description: "Try a clearer, closer photo.", variant: "error" });
        return;
      }

      onExtract(parseFloat(match[1]));
      toast({ title: "Reading captured", description: `Detected ${match[1]}`, variant: "success" });
    } catch (err) {
      toast({ title: "Scan failed", description: err instanceof Error ? err.message : undefined, variant: "error" });
    } finally {
      setScanning(false);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
      <Button type="button" variant="outline" size="sm" disabled={scanning} onClick={() => inputRef.current?.click()}>
        {scanning ? <Spinner className="h-3.5 w-3.5" /> : <ScanLine className="h-3.5 w-3.5" />}
        {scanning ? "Reading…" : label}
      </Button>
    </>
  );
}
