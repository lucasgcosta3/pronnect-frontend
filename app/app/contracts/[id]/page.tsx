"use client";

import type { PaymentResponse, ServiceContractResponse } from "@/lib/types";
import { ApiError, api } from "@/lib/api";
import { getRoleFromToken } from "@/lib/auth";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";

export default function ContractDetailPage() {
  const params = useParams();
  const contractId = params.id as string;
  const role = getRoleFromToken();
  const router = useRouter();

  const [contract, setContract] = useState<ServiceContractResponse | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const [payAmount, setPayAmount] = useState("");
  const [paying, setPaying] = useState(false);
  const [releasing, setReleasing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const c = await api<ServiceContractResponse>(`/contracts/${contractId}`);
      setContract(c);
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError("Contrato não encontrado.");
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    load();
  }, [load]);

  async function markComplete() {
    setActionMsg(null);
    try {
      const c = await api<ServiceContractResponse>(
        `/contracts/${contractId}/complete`,
        { method: "PATCH" }
      );
      setContract(c);
      setActionMsg("Serviço marcado como concluído.");
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
    }
  }

  async function validate() {
    setActionMsg(null);
    try {
      const c = await api<ServiceContractResponse>(
        `/contracts/${contractId}/validate`,
        { method: "PATCH" }
      );
      setContract(c);
      setActionMsg("Serviço validado. Você pode liberar o pagamento.");
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
    }
  }

  async function holdPayment(e: FormEvent) {
    e.preventDefault();
    setPaying(true);
    setError(null);
    setActionMsg(null);
    try {
      await api<PaymentResponse>("/payments", {
        method: "POST",
        json: {
          serviceContractId: contractId,
          amount: Number(payAmount),
        },
      });
      setPayAmount("");
      setActionMsg("Pagamento registrado em hold (simulado).");
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    } finally {
      setPaying(false);
    }
  }

  async function releasePayment() {
    setReleasing(true);
    setError(null);
    setActionMsg(null);
    try {
      await api<PaymentResponse>(
        `/payments/contract/${contractId}/release`,
        { method: "PATCH" }
      );
      setActionMsg("Pagamento liberado (simulado).");
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    } finally {
      setReleasing(false);
    }
  }

  if (loading) {
    return <p className="text-on-surface-variant">Carregando…</p>;
  }

  if (!contract) {
    return <p className="text-error">{error || "Não encontrado."}</p>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-4 text-sm text-secondary hover:underline"
      >
        Voltar
      </button>
      <h1 className="font-headline text-2xl text-primary">Contrato de serviço</h1>
      <p className="mt-2 text-sm text-on-surface-variant">
        Proposta:{" "}
        <span className="font-mono text-on-surface">{contract.proposalId}</span>
      </p>
      <p className="mt-4 text-lg font-bold text-primary">
        Status: {contract.status}
      </p>
      <ul className="mt-4 space-y-2 text-sm text-on-surface-variant">
        <li>Início: {new Date(contract.startedAt).toLocaleString("pt-BR")}</li>
        {contract.completedAt && (
          <li>
            Concluído:{" "}
            {new Date(contract.completedAt).toLocaleString("pt-BR")}
          </li>
        )}
        {contract.validatedAt && (
          <li>
            Validado: {new Date(contract.validatedAt).toLocaleString("pt-BR")}
          </li>
        )}
      </ul>

      {actionMsg && (
        <p className="mt-4 rounded-lg bg-secondary-container/40 p-3 text-sm text-on-secondary-container">
          {actionMsg}
        </p>
      )}
      {error && <p className="mt-4 text-sm text-error">{error}</p>}

      <div className="mt-8 space-y-6">
        {role === "PROFESSIONAL" && contract.status === "IN_PROGRESS" && (
          <button
            type="button"
            onClick={markComplete}
            className="rounded-xl bg-primary px-6 py-3 font-bold text-on-primary"
          >
            Marcar como concluído
          </button>
        )}

        {role === "COMPANY" && contract.status === "COMPLETED" && (
          <button
            type="button"
            onClick={validate}
            className="rounded-xl bg-secondary px-6 py-3 font-bold text-on-secondary"
          >
            Validar entrega
          </button>
        )}

        {role === "COMPANY" && contract.status === "IN_PROGRESS" && (
          <form
            onSubmit={holdPayment}
            className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
          >
            <h2 className="font-headline mb-2 text-lg text-primary">
              Pagamento em hold
            </h2>
            <p className="mb-4 text-sm text-on-surface-variant">
              Valor total a reservar (taxa da plataforma calculada na API).
            </p>
            <input
              type="number"
              required
              min={0}
              step="0.01"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              className="mb-4 w-full rounded-lg border border-outline-variant px-3 py-2"
              placeholder="Valor (R$)"
            />
            <button
              type="submit"
              disabled={paying}
              className="rounded-xl bg-primary px-6 py-2 font-bold text-on-primary disabled:opacity-50"
            >
              {paying ? "Enviando…" : "Registrar hold"}
            </button>
          </form>
        )}

        {role === "COMPANY" && contract.status === "VALIDATED" && (
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
            <h2 className="font-headline mb-2 text-lg text-primary">
              Liberar pagamento
            </h2>
            <p className="mb-4 text-sm text-on-surface-variant">
              Disponível após validar o serviço e existir um pagamento em hold.
            </p>
            <button
              type="button"
              disabled={releasing}
              onClick={releasePayment}
              className="rounded-xl bg-secondary px-6 py-2 font-bold text-on-secondary disabled:opacity-50"
            >
              {releasing ? "Processando…" : "Liberar pagamento"}
            </button>
          </div>
        )}
      </div>

      <p className="mt-10">
        <Link href="/app" className="text-secondary hover:underline">
          Painel
        </Link>
      </p>
    </div>
  );
}
