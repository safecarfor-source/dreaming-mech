import { useState } from "react";

const tiers = [
  { label: "5% 이상 하락", min: -999, max: -5, rate: 0.3, color: "#EF4444", bg: "#FEF2F2" },
  { label: "0~5% 하락",   min: -5,   max: 0,  rate: 0.5, color: "#F97316", bg: "#FFF7ED" },
  { label: "동일 ~ 5% 성장", min: 0, max: 5,  rate: 0.6, color: "#6B7280", bg: "#F9FAFB" },
  { label: "5~8% 성장",   min: 5,    max: 8,  rate: 0.7, color: "#8B5CF6", bg: "#F5F3FF" },
  { label: "8% 이상 성장", min: 8,    max: 999, rate: 0.9, color: "#7C3AED", bg: "#EDE9FE" },
];

function getCurrentTierIndex(growthRate) {
  if (growthRate <= -5) return 0;
  if (growthRate <= 0) return 1;
  if (growthRate <= 5) return 2;
  if (growthRate <= 8) return 3;
  return 4;
}

function formatMoney(val) {
  if (Math.abs(val) >= 10000) {
    const uk = Math.floor(Math.abs(val) / 10000);
    const remainder = Math.abs(val) % 10000;
    const sign = val < 0 ? "-" : "";
    if (remainder === 0) return `${sign}${uk}억`;
    return `${sign}${uk}억 ${remainder.toLocaleString()}만`;
  }
  return `${val.toLocaleString()}만`;
}

export default function IncentiveSimulator() {
  const [lastYear, setLastYear] = useState(14000);
  const [thisMonth, setThisMonth] = useState(13500);
  const [editingLast, setEditingLast] = useState(false);
  const [editingThis, setEditingThis] = useState(false);
  const [inputLast, setInputLast] = useState("14000");
  const [inputThis, setInputThis] = useState("13500");

  const growthRate = lastYear > 0 ? ((thisMonth - lastYear) / lastYear) * 100 : 0;
  const currentIdx = getCurrentTierIndex(growthRate);
  const currentTier = tiers[currentIdx];
  const maxTier = tiers[4];

  const currentIncentive = Math.round(thisMonth * currentTier.rate * 0.01);
  const maxSales = Math.round(lastYear * 1.10);
  const maxIncentive = Math.round(maxSales * maxTier.rate * 0.01);
  const gap = maxIncentive - currentIncentive;

  const nextTier = currentIdx < 4 ? tiers[currentIdx + 1] : null;
  const nextThreshold = nextTier ? Math.round(lastYear * (1 + nextTier.min / 100)) : null;
  const nextGap = nextThreshold ? nextThreshold - thisMonth : 0;
  const tireCount = nextGap > 0 ? Math.ceil(nextGap / 50) : 0;

  return (
    <div style={{
      minHeight: "100vh", background: "#FAFAFA",
      fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif",
      padding: "20px 16px", maxWidth: 480, margin: "0 auto",
    }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111", margin: "0 0 4px" }}>
        이정석 부장 인센티브
      </h2>
      <p style={{ fontSize: 13, color: "#999", margin: "0 0 20px" }}>
        작년 동월 매출 기준 · 배율 5단계
      </p>

      {/* Input Cards */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <InputCard label="작년 동월 매출" value={lastYear} editing={editingLast} inputVal={inputLast}
          onEdit={() => { setInputLast(String(lastYear)); setEditingLast(true); }}
          onChange={setInputLast}
          onConfirm={() => { const v = parseInt(inputLast); if (v > 0) setLastYear(v); setEditingLast(false); }}
        />
        <InputCard label="이번 달 매출" value={thisMonth} editing={editingThis} inputVal={inputThis}
          onEdit={() => { setInputThis(String(thisMonth)); setEditingThis(true); }}
          onChange={setInputThis}
          onConfirm={() => { const v = parseInt(inputThis); if (v >= 0) setThisMonth(v); setEditingThis(false); }}
          accent
        />
      </div>

      {/* Growth Rate Badge */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <span style={{
          display: "inline-block", background: currentTier.bg, color: currentTier.color,
          fontSize: 14, fontWeight: 700, padding: "6px 16px", borderRadius: 20,
        }}>
          작년 대비 {growthRate >= 0 ? "+" : ""}{growthRate.toFixed(1)}%
        </span>
      </div>

      {/* 1. 현재 구간 */}
      <SectionLabel emoji="📍" text="지금 받는 금액" />
      <TierCard tier={currentTier} sales={thisMonth} incentive={currentIncentive} isCurrent highlight="current" />

      {/* Next tier nudge */}
      {nextTier && nextGap > 0 && (
        <div style={{
          background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10,
          padding: "12px 14px", marginTop: 10, marginBottom: 20,
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#92400E", margin: 0 }}>
            💡 다음 구간({nextTier.rate}%)까지{" "}
            <span style={{ color: "#D97706", fontWeight: 800 }}>{formatMoney(nextGap)}원</span> 남음
          </p>
          <p style={{ fontSize: 12, color: "#B45309", margin: "4px 0 0" }}>
            → 타이어 약 <strong>{tireCount}대</strong>만 더 잡으면 구간 돌파
          </p>
        </div>
      )}

      {/* 2. MAX 구간 */}
      <SectionLabel emoji="🏆" text="노력하면 받을 수 있는 금액" />
      <TierCard tier={maxTier} sales={maxSales} incentive={maxIncentive} highlight="max" />

      {/* Gap Highlight */}
      <div style={{
        background: "#F5F3FF", border: "1.5px solid #7C3AED", borderRadius: 10,
        padding: "14px 16px", marginTop: 10, marginBottom: 20, textAlign: "center",
      }}>
        <p style={{ fontSize: 12, color: "#7C3AED", margin: "0 0 4px", fontWeight: 500 }}>
          지금 vs MAX 차이
        </p>
        <p style={{ fontSize: 24, fontWeight: 800, color: "#7C3AED", margin: 0 }}>
          +{gap.toLocaleString()}만원
        </p>
        <p style={{ fontSize: 12, color: "#8B5CF6", margin: "4px 0 0" }}>
          매달 이만큼 더 받을 수 있습니다
        </p>
      </div>

      {/* 3. 전체 배율표 */}
      <SectionLabel emoji="📊" text="전체 배율표" />
      {tiers.map((tier, i) => {
        const estSales = i === currentIdx ? thisMonth
          : i === 4 ? maxSales
          : Math.round(lastYear * (1 + (tier.min + tier.max) / 2 / 100));
        const estIncentive = Math.round(estSales * tier.rate * 0.01);
        return (
          <div key={i} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 14px", marginBottom: 6,
            background: i === currentIdx ? currentTier.bg : "#fff",
            borderRadius: 10,
            border: i === currentIdx ? `1.5px solid ${currentTier.color}`
              : i === 4 ? "1.5px solid #7C3AED"
              : "1px solid #F0F0F0",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {i === currentIdx && <span style={{ fontSize: 12 }}>📍</span>}
              {i === 4 && i !== currentIdx && <span style={{ fontSize: 12 }}>🏆</span>}
              <span style={{
                fontSize: 12, fontWeight: 600, color: tier.color,
                background: tier.bg, padding: "2px 8px", borderRadius: 4,
              }}>
                {tier.rate}%
              </span>
              <span style={{ fontSize: 13, color: "#555" }}>{tier.label}</span>
            </div>
            <span style={{
              fontSize: 15, fontWeight: 700,
              color: i === currentIdx ? currentTier.color : i === 4 ? "#7C3AED" : "#888",
            }}>
              {estIncentive.toLocaleString()}만
            </span>
          </div>
        );
      })}

      <p style={{ fontSize: 11, color: "#BBB", textAlign: "center", marginTop: 20 }}>
        타이어 단가 50만원 기준 · 매출 입력 시 자동 계산
      </p>
    </div>
  );
}

function SectionLabel({ emoji, text }) {
  return (
    <p style={{ fontSize: 13, fontWeight: 700, color: "#555", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 6 }}>
      <span>{emoji}</span> {text}
    </p>
  );
}

function TierCard({ tier, sales, incentive, isCurrent, highlight }) {
  const borderColor = highlight === "current" ? tier.color : highlight === "max" ? "#7C3AED" : "#F0F0F0";
  const bgColor = highlight === "current" ? tier.bg : highlight === "max" ? "#EDE9FE" : "#fff";
  return (
    <div style={{ background: bgColor, borderRadius: 14, border: `2px solid ${borderColor}`, padding: "18px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ background: tier.color, color: "#fff", fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 6 }}>
            배율 {tier.rate}%
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>{tier.label}</span>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <p style={{ fontSize: 11, color: "#999", margin: "0 0 2px" }}>{isCurrent ? "현재 매출" : "목표 매출"}</p>
          <p style={{ fontSize: 15, fontWeight: 600, color: "#555", margin: 0 }}>{formatMoney(sales)}원</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 11, color: "#999", margin: "0 0 2px" }}>월 인센티브</p>
          <p style={{ fontSize: 26, fontWeight: 800, color: highlight === "max" ? "#7C3AED" : tier.color, margin: 0, letterSpacing: -0.5 }}>
            {incentive.toLocaleString()}만원
          </p>
        </div>
      </div>
    </div>
  );
}

function InputCard({ label, value, editing, inputVal, onEdit, onChange, onConfirm, accent }) {
  return (
    <div style={{
      flex: 1, background: "#fff", borderRadius: 10, padding: "12px",
      border: accent ? "1.5px solid #7C3AED" : "1px solid #F0F0F0",
    }}>
      <p style={{ fontSize: 11, color: "#999", margin: "0 0 4px" }}>{label}</p>
      {editing ? (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <input type="number" value={inputVal} onChange={(e) => onChange(e.target.value)}
            style={{ width: "100%", fontSize: 15, fontWeight: 700, border: "1px solid #DDD", borderRadius: 6, padding: "4px 6px", outline: "none" }}
            autoFocus onKeyDown={(e) => e.key === "Enter" && onConfirm()}
          />
          <button onClick={onConfirm} style={{
            fontSize: 11, background: "#7C3AED", color: "#fff", border: "none",
            borderRadius: 6, padding: "6px 8px", cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap",
          }}>확인</button>
        </div>
      ) : (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 17, fontWeight: 700, color: accent ? "#7C3AED" : "#111", margin: 0 }}>
            {value >= 10000 ? `${(value / 10000).toFixed(1)}억` : `${value.toLocaleString()}만`}
          </p>
          <button onClick={onEdit} style={{
            fontSize: 11, color: "#999", background: "#F5F5F5", border: "none",
            borderRadius: 4, padding: "3px 8px", cursor: "pointer",
          }}>수정</button>
        </div>
      )}
    </div>
  );
}
