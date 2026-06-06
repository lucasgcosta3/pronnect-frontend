import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { PaymentResponse } from "@/lib/types";
import { Check, Copy, AlertCircle, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface PixPaymentProps {
  payment: PaymentResponse;
  onPaymentApproved?: (payment: PaymentResponse) => void;
}

export function PixPayment({ payment, onPaymentApproved }: PixPaymentProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [currentPayment, setCurrentPayment] = useState<PaymentResponse>(payment);
  const approvedRef = useRef(false);

  // Generate QR Code from PIX copy-paste string
  useEffect(() => {
    if (!currentPayment.pixQrCode || currentPayment.status !== "PENDING") return;

    QRCode.toDataURL(currentPayment.pixQrCode, {
      width: 256,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then(setQrCodeDataUrl)
      .catch(() => setQrCodeDataUrl(""));
  }, [currentPayment.pixQrCode, currentPayment.status]);

  // Expiry countdown timer
  useEffect(() => {
    if (currentPayment.status !== "PENDING" || !currentPayment.expiresAt) return;

    const expiresAtStr = currentPayment.expiresAt;
    const hasTimezone = expiresAtStr.endsWith("Z") || expiresAtStr.includes("+") || /-\d{2}:\d{2}$/.test(expiresAtStr);
    const formattedDateStr = hasTimezone ? expiresAtStr : `${expiresAtStr.replace(" ", "T")}Z`;
    const expiresAt = new Date(formattedDateStr).getTime();

    const tick = () => {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [currentPayment.expiresAt, currentPayment.status]);

  // Polling — check status every 3 seconds while PENDING
  useEffect(() => {
    if (currentPayment.status !== "PENDING") return;

    const poll = async () => {
      try {
        const updated = await api<PaymentResponse>(
          `/payments/contract/${currentPayment.serviceContractId}`,
        );
        setCurrentPayment(updated);

        if ((updated.status === "HELD" || updated.status === "RELEASED") && !approvedRef.current) {
          approvedRef.current = true;
          toast.success("Pagamento confirmado com sucesso!");
          onPaymentApproved?.(updated);
        }
      } catch {
        // Silent — will retry on next interval
      }
    };

    // Poll immediately, then every 3 seconds
    poll();
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, [currentPayment.status, currentPayment.serviceContractId, onPaymentApproved]);

  const copyToClipboard = () => {
    if (!currentPayment.pixCopyPaste) return;
    navigator.clipboard
      .writeText(currentPayment.pixCopyPaste)
      .then(() => toast.success("Código PIX copiado!"))
      .catch(() => toast.error("Não foi possível copiar. Selecione e copie manualmente."));
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}min`;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  // ─── Confirmed state ───────────────────────────────────────────────────────
  if (currentPayment.status === "HELD" || currentPayment.status === "RELEASED") {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-2xl p-8 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-emerald-500/25">
          <Check size={32} strokeWidth={3} />
        </div>
        <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mb-2">
          Pagamento Confirmado!
        </h3>
        <p className="text-emerald-600/80 dark:text-emerald-500/80 text-sm">
          O valor está retido com segurança e o serviço pode ser iniciado.
        </p>
      </div>
    );
  }

  // ─── Expired / Cancelled / Refunded state ──────────────────────────────────
  if (
    currentPayment.status === "CANCELLED" ||
    currentPayment.status === "REFUNDED" ||
    (timeLeft === 0 && currentPayment.status === "PENDING" && currentPayment.expiresAt)
  ) {
    const label =
      currentPayment.status === "REFUNDED"
        ? "Pagamento Reembolsado"
        : currentPayment.status === "CANCELLED"
          ? "Pagamento Cancelado"
          : "Código PIX Expirado";

    return (
      <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-8 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h3 className="text-xl font-bold text-destructive mb-2">{label}</h3>
        <p className="text-muted-foreground text-sm">
          Gere um novo pagamento para continuar com o contrato.
        </p>
      </div>
    );
  }

  // ─── Pending state (main view) ─────────────────────────────────────────────
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm max-w-md mx-auto">
      {/* Header */}
      <div className="bg-muted/40 px-6 py-5 text-center border-b border-border">
        <h3 className="text-lg font-bold text-foreground">Pague com PIX</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Escaneie o QR Code no aplicativo do seu banco
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* QR Code */}
        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-2xl border border-border/60 shadow-sm">
            {qrCodeDataUrl ? (
              <img src={qrCodeDataUrl} alt="QR Code PIX" className="w-52 h-52" />
            ) : (
              <div className="w-52 h-52 flex items-center justify-center bg-muted rounded-xl">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* Amount & Status */}
        <div className="text-center space-y-2">
          <p className="text-3xl font-black text-foreground">
            {formatCurrency(currentPayment.amount)}
          </p>
          <div className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 px-4 py-1.5 rounded-full text-sm font-semibold border border-amber-200/60 dark:border-amber-800/40">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            Aguardando confirmação...
          </div>
        </div>

        {/* Copy-paste PIX code */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Ou copie o código PIX
          </p>
          <div className="flex rounded-xl overflow-hidden border border-border">
            <input
              type="text"
              readOnly
              value={currentPayment.pixCopyPaste ?? ""}
              aria-label="Código PIX"
              className="flex-1 bg-muted px-4 py-2.5 text-sm text-muted-foreground outline-none truncate"
            />
            <button
              onClick={copyToClipboard}
              className="bg-primary text-primary-foreground px-4 py-2.5 font-semibold text-sm transition-colors hover:bg-primary/90 flex items-center gap-2 shrink-0"
            >
              <Copy size={15} />
              Copiar
            </button>
          </div>
        </div>

        {/* Expiry timer */}
        {timeLeft > 0 && (
          <div className="bg-muted/50 rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock size={15} />
              Código expira em
            </div>
            <p className="text-base font-bold font-mono text-foreground">{formatTime(timeLeft)}</p>
          </div>
        )}
      </div>
    </div>
  );
}