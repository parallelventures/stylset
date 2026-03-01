import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    description?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDestructive?: boolean;
    confirmText?: string;
    cancelText?: string;
}

export function ConfirmModal({
    isOpen,
    title,
    description,
    onConfirm,
    onCancel,
    isDestructive = true,
    confirmText = "Confirm",
    cancelText = "Cancel",
}: ConfirmModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="modal-overlay"
                    onClick={onCancel}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ zIndex: 9999 }}
                >
                    <motion.div
                        className="modal"
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        transition={{ type: "spring", stiffness: 450, damping: 30 }}
                        style={{ maxWidth: 400, padding: 24 }}
                    >
                        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 20 }}>
                            {isDestructive && (
                                <div style={{
                                    background: "var(--danger-subtle)",
                                    color: "var(--danger)",
                                    width: 40,
                                    height: 40,
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0
                                }}>
                                    <AlertTriangle size={20} />
                                </div>
                            )}
                            <div>
                                <h3 style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em", margin: 0 }}>
                                    {title}
                                </h3>
                                {description && (
                                    <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 6, lineHeight: 1.4 }}>
                                        {description}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 8 }}>
                            <button className="btn btn-secondary" onClick={onCancel}>
                                {cancelText}
                            </button>
                            <button
                                className={`btn ${isDestructive ? 'btn-danger' : 'btn-primary'}`}
                                onClick={() => {
                                    onConfirm();
                                    onCancel();
                                }}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
