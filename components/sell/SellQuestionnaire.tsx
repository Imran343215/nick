"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { BrandShape, DeviceShape } from "@/lib/repair-catalog";
import type { SellQuestionShape, SellVariantShape } from "@/lib/sell-catalog";
import {
  loadSellCart,
  saveSellCart,
  sellCartQuote,
  setAnswerInCart,
  type SellCart,
} from "@/lib/sell-cart";
import { formatPrice } from "@/lib/utils";
import { resolveAdjustment } from "@/lib/sell-quote";
import { useToast } from "@/components/ui/toast";

export default function SellQuestionnaire({
  brand,
  device,
  variants,
  questions,
}: {
  brand: BrandShape;
  device: DeviceShape;
  variants: SellVariantShape[];
  questions: SellQuestionShape[];
}) {
  const router = useRouter();
  const toast = useToast();

  const defaultVariant = variants[0];

  const initialCart = useMemo<SellCart | null>(() => {
    const existing = loadSellCart(brand.slug, device.slug);
    if (existing) return existing;
    if (!defaultVariant) return null;
    return {
      brandSlug: brand.slug,
      brandName: brand.name,
      deviceSlug: device.slug,
      deviceName: device.name,
      deviceImage: device.image,
      variantId: defaultVariant._id,
      variantLabel: defaultVariant.label,
      basePrice: defaultVariant.basePrice,
      answers: [],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand.slug, device.slug]);

  const [cart, setCart] = useState<SellCart | null>(initialCart);

  useEffect(() => {
    if (cart) saveSellCart(cart);
  }, [cart]);

  if (!defaultVariant || !cart) {
    return <div className="empty-note">No storage/RAM variants are listed for this device yet.</div>;
  }

  function selectVariant(variant: SellVariantShape) {
    setCart((prev) =>
      prev
        ? { ...prev, variantId: variant._id, variantLabel: variant.label, basePrice: variant.basePrice }
        : prev
    );
  }

  function selectAnswer(
    question: SellQuestionShape,
    option: { label: string; adjustmentType: "flat" | "percent"; direction: "reduce" | "increase"; value: number }
  ) {
    setCart((prev) =>
      prev
        ? setAnswerInCart(prev, {
            questionId: question._id,
            questionText: question.text,
            optionLabel: option.label,
            adjustmentType: option.adjustmentType,
            direction: option.direction,
            value: option.value,
          })
        : prev
    );
  }

  const answeredIds = new Set(cart.answers.map((a) => a.questionId));
  const allAnswered = questions.every((q) => answeredIds.has(q._id));
  const quote = sellCartQuote(cart);

  function continueToCheckout() {
    if (!allAnswered) {
      toast.error("Answer every question to see your final quote.");
      return;
    }
    router.push(`/sell/${brand.slug}/${device.slug}/checkout`);
  }

  return (
    <div className="repair-booking">
      <nav className="repair-breadcrumbs">
        <Link href="/sell">All brands</Link>
        <span>/</span>
        <Link href={`/sell/${brand.slug}`}>{brand.name}</Link>
        <span>/</span>
        <span>{device.name}</span>
      </nav>

      <div className="repair-booking__layout">
        <div className="repair-booking__main">
          <div className="repair-device-hero">
            <img src={device.image} alt={device.name} />
            <div>
              <p className="repair-device-hero__brand">{brand.name}</p>
              <h1>Sell your {device.name}</h1>
            </div>
          </div>

          <h2 className="repair-section-title">Choose your storage / variant</h2>
          <div className="repair-service-grid">
            {variants.map((variant) => {
              const selected = cart.variantId === variant._id;
              return (
                <article
                  key={variant._id}
                  className={`repair-service-card${selected ? " repair-service-card--selected" : ""}`}
                >
                  <h3>{variant.label}</h3>
                  <div className="repair-service-card__price">
                    <strong>Max price {formatPrice(variant.basePrice)}</strong>
                  </div>
                  <button
                    type="button"
                    className={`btn ${selected ? "btn--repair-remove" : "btn--repair"}`}
                    onClick={() => selectVariant(variant)}
                  >
                    {selected ? "Selected" : "Select"}
                  </button>
                </article>
              );
            })}
          </div>

          <h2 className="repair-section-title">Tell us about its condition</h2>
          {questions.length === 0 ? (
            <div className="empty-note">No condition questions are set up yet.</div>
          ) : (
            questions.map((question) => {
              const currentAnswer = cart.answers.find((a) => a.questionId === question._id);
              return (
                <div className="repair-checkout-step" key={question._id}>
                  <div className="repair-checkout-step__head">
                    <span className="repair-checkout-step__num">?</span>
                    <h2>{question.text}</h2>
                  </div>
                  <div className="repair-service-grid">
                    {question.options.map((option) => {
                      const selected = currentAnswer?.optionLabel === option.label;
                      const delta = resolveAdjustment(cart.basePrice, option);
                      return (
                        <button
                          key={option.label}
                          type="button"
                          className={`btn ${selected ? "btn--repair-remove" : "btn--repair-outline"}`}
                          onClick={() => selectAnswer(question, option)}
                        >
                          {option.label}
                          {delta !== 0 && (
                            <small style={{ display: "block", opacity: 0.75 }}>
                              {option.adjustmentType === "percent"
                                ? `${option.direction === "increase" ? "+" : "-"}${Math.abs(option.value)}% (${delta >= 0 ? "+" : ""}${formatPrice(delta)})`
                                : `${delta >= 0 ? "+" : ""}${formatPrice(delta)}`}
                            </small>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="repair-price-summary">
          <h2>Your quote</h2>
          <div className="repair-price-summary__items">
            <div className="repair-price-summary__item">
              <span className="repair-price-summary__item-name">{device.name} — {cart.variantLabel} (Max price)</span>
              <span className="repair-price-summary__item-price">{formatPrice(cart.basePrice)}</span>
            </div>
            {cart.answers.map((a) => {
              const delta = resolveAdjustment(cart.basePrice, a);
              return (
                <div className="repair-price-summary__item" key={a.questionId}>
                  <span className="repair-price-summary__item-name">
                    {a.optionLabel}
                    {a.adjustmentType === "percent" && (
                      <small style={{ opacity: 0.7 }}>
                        {" "}
                        ({a.direction === "increase" ? "+" : "-"}
                        {Math.abs(a.value)}%)
                      </small>
                    )}
                  </span>
                  <span className="repair-price-summary__item-price">
                    {delta >= 0 ? "+" : ""}
                    {formatPrice(delta)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="repair-price-summary__total">
            <span>Estimated payout</span>
            <strong>{formatPrice(quote)}</strong>
          </div>
          <p className="form__note">
            Final payout is confirmed after our team inspects the device at pickup.
          </p>
          <button type="button" className="btn btn--repair" onClick={continueToCheckout}>
            Continue — Schedule Pickup
          </button>
        </div>
      </div>
    </div>
  );
}
