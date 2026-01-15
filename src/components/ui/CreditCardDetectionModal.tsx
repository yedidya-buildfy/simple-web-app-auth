"use client";

import { useState } from "react";
import {
  CreditCardIcon,
  PlusIcon,
  XMarkIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { DetectedCreditCardPayment, CreditCard } from "@/lib/processors/types";

interface CreditCardDetectionModalProps {
  isOpen: boolean;
  payments: DetectedCreditCardPayment[];
  existingCards: CreditCard[];
  onConfirm: (assignments: Map<number, string | null>) => void; // transactionIndex -> creditCardId
  onCreateCard: (card: Omit<CreditCard, "id" | "userId">) => Promise<CreditCard>;
  onClose: () => void;
}

interface PaymentAssignment {
  transactionIndex: number;
  creditCardId: string | null;
}

export function CreditCardDetectionModal({
  isOpen,
  payments,
  existingCards,
  onConfirm,
  onCreateCard,
  onClose,
}: CreditCardDetectionModalProps) {
  const [assignments, setAssignments] = useState<PaymentAssignment[]>(
    payments.map((p) => ({ transactionIndex: p.transactionIndex, creditCardId: null }))
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCardName, setNewCardName] = useState("");
  const [newCardLastFour, setNewCardLastFour] = useState("");
  const [newCardType, setNewCardType] = useState<string>("visa");
  const [creating, setCreating] = useState(false);
  const [cards, setCards] = useState<CreditCard[]>(existingCards);

  if (!isOpen || payments.length === 0) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: "ILS",
    }).format(amount);
  };

  const handleAssignment = (transactionIndex: number, creditCardId: string | null) => {
    setAssignments((prev) =>
      prev.map((a) =>
        a.transactionIndex === transactionIndex ? { ...a, creditCardId } : a
      )
    );
  };

  const handleCreateCard = async () => {
    if (!newCardName.trim()) return;

    setCreating(true);
    try {
      const newCard = await onCreateCard({
        name: newCardName.trim(),
        lastFour: newCardLastFour || undefined,
        cardType: newCardType || undefined,
        bankPatterns: [],
        isActive: true,
      });
      setCards((prev) => [...prev, newCard]);
      setShowCreateForm(false);
      setNewCardName("");
      setNewCardLastFour("");
      setNewCardType("visa");
    } catch (error) {
      console.error("Failed to create card:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleConfirm = () => {
    const assignmentMap = new Map<number, string | null>();
    assignments.forEach((a) => {
      assignmentMap.set(a.transactionIndex, a.creditCardId);
    });
    onConfirm(assignmentMap);
  };

  const assignedCount = assignments.filter((a) => a.creditCardId !== null).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-background border border-border rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green/20 flex items-center justify-center">
              <CreditCardIcon className="w-5 h-5 text-green" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Credit Card Payments Detected
              </h3>
              <p className="text-sm text-foreground-muted">
                {payments.length} payment{payments.length !== 1 ? "s" : ""} found in this bank statement
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-foreground-muted hover:text-foreground rounded-lg hover:bg-background-hover transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Detected Payments */}
          <div className="space-y-3">
            {payments.map((payment, index) => {
              const assignment = assignments.find(
                (a) => a.transactionIndex === payment.transactionIndex
              );
              const selectedCard = cards.find(
                (c) => c.id === assignment?.creditCardId
              );

              return (
                <div
                  key={payment.transactionIndex}
                  className="border border-border rounded-lg p-4 bg-background-secondary"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {payment.description}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-foreground-muted">
                        <span>{payment.date}</span>
                        <span className="text-green font-medium">
                          {formatCurrency(payment.amount)}
                        </span>
                        {payment.suggestedCardName && (
                          <span className="text-foreground-muted">
                            Suggested: {payment.suggestedCardName}
                            {payment.suggestedLastFour && ` (${payment.suggestedLastFour})`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Selection */}
                    <div className="flex-shrink-0">
                      <select
                        value={assignment?.creditCardId || ""}
                        onChange={(e) =>
                          handleAssignment(
                            payment.transactionIndex,
                            e.target.value || null
                          )
                        }
                        className="w-48 px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-green"
                      >
                        <option value="">Select card...</option>
                        {cards.map((card) => (
                          <option key={card.id} value={card.id}>
                            {card.name}
                            {card.lastFour && ` (${card.lastFour})`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {selectedCard && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-green">
                      <CheckIcon className="w-4 h-4" />
                      <span>Assigned to {selectedCard.name}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Create New Card Section */}
          {showCreateForm ? (
            <div className="mt-6 border border-border rounded-lg p-4 bg-background">
              <h4 className="text-sm font-medium text-foreground mb-3">
                Create New Credit Card
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-foreground-muted mb-1">
                    Card Name *
                  </label>
                  <input
                    type="text"
                    value={newCardName}
                    onChange={(e) => setNewCardName(e.target.value)}
                    placeholder="e.g., Visa Gold, Max Card"
                    className="w-full px-3 py-2 text-sm bg-background-secondary border border-border rounded-lg text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-green"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-foreground-muted mb-1">
                      Last 4 Digits
                    </label>
                    <input
                      type="text"
                      value={newCardLastFour}
                      onChange={(e) =>
                        setNewCardLastFour(e.target.value.replace(/\D/g, "").slice(0, 4))
                      }
                      placeholder="1234"
                      maxLength={4}
                      className="w-full px-3 py-2 text-sm bg-background-secondary border border-border rounded-lg text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-green"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-foreground-muted mb-1">
                      Card Type
                    </label>
                    <select
                      value={newCardType}
                      onChange={(e) => setNewCardType(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-background-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-green"
                    >
                      <option value="visa">Visa</option>
                      <option value="mastercard">Mastercard</option>
                      <option value="amex">American Express</option>
                      <option value="isracard">Isracard</option>
                      <option value="max">Max</option>
                      <option value="diners">Diners</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateCard}
                    disabled={!newCardName.trim() || creating}
                    className="flex-1 px-4 py-2 bg-green text-background font-medium text-sm rounded-lg hover:bg-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {creating ? "Creating..." : "Create Card"}
                  </button>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-foreground-muted font-medium text-sm rounded-lg hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCreateForm(true)}
              className="mt-4 flex items-center gap-2 text-sm text-green hover:text-green/80 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Create new credit card
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-background-secondary rounded-b-xl">
          <div className="flex items-center justify-between">
            <p className="text-sm text-foreground-muted">
              {assignedCount} of {payments.length} payments assigned
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-foreground font-medium rounded-lg border border-border hover:bg-background-hover transition-colors"
              >
                Skip All
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-green text-background font-medium rounded-lg hover:bg-green/90 transition-colors"
              >
                Confirm Assignments
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
