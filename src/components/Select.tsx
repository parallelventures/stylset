"use client";

import React, { ReactNode } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import "./Select.css";

interface Item {
    value: string;
    label: string | ReactNode;
}

interface SelectProps {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    placeholder?: string;
    items: Item[];
    name?: string;
    id?: string;
    className?: string;
    disabled?: boolean;
}

export function Select({
    value,
    defaultValue,
    onValueChange,
    placeholder = "Select an option...",
    items,
    name,
    id,
    className,
    disabled = false,
}: SelectProps) {
    return (
        <SelectPrimitive.Root
            value={value}
            defaultValue={defaultValue}
            onValueChange={onValueChange}
            name={name}
            disabled={disabled}
        >
            <SelectPrimitive.Trigger
                id={id}
                className={`CustomSelectTrigger ${className || ""}`}
            >
                <SelectPrimitive.Value placeholder={placeholder} />
                <SelectPrimitive.Icon className="CustomSelectIcon">
                    <ChevronDown size={14} />
                </SelectPrimitive.Icon>
            </SelectPrimitive.Trigger>

            <SelectPrimitive.Portal>
                <SelectPrimitive.Content
                    className="CustomSelectContent"
                    position="popper"
                    sideOffset={6}
                >
                    <SelectPrimitive.ScrollUpButton className="CustomSelectScrollButton">
                        <ChevronUp size={14} />
                    </SelectPrimitive.ScrollUpButton>

                    <SelectPrimitive.Viewport className="CustomSelectViewport">
                        {items.map((item) => (
                            <SelectPrimitive.Item
                                key={item.value}
                                value={item.value}
                                className="CustomSelectItem"
                            >
                                <SelectPrimitive.ItemText>
                                    {item.label}
                                </SelectPrimitive.ItemText>
                                <SelectPrimitive.ItemIndicator className="CustomSelectItemIndicator">
                                    <Check size={14} />
                                </SelectPrimitive.ItemIndicator>
                            </SelectPrimitive.Item>
                        ))}
                    </SelectPrimitive.Viewport>

                    <SelectPrimitive.ScrollDownButton className="CustomSelectScrollButton">
                        <ChevronDown size={14} />
                    </SelectPrimitive.ScrollDownButton>
                </SelectPrimitive.Content>
            </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
    );
}
