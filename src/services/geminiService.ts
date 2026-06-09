/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { StockItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getInventoryInsights(items: StockItem[]) {
  if (!process.env.GEMINI_API_KEY) {
    return "يرجى إعداد مفتاح API الخاص بـ Gemini للحصول على تحليلات ذكية.";
  }

  const inventorySummary = items.map(item => ({
    name: item.name,
    stock: item.stockByBranch,
    min: item.minStockLevel
  }));

  const prompt = `
    أنت خبير في إدارة سلاسل الإمداد لعيادات الأسنان. 
    بناءً على قائمة المخزون التالية (بصيغة JSON)، قدم 3 نصائح سريعة ومختصرة باللغة العربية:
    1. أي الأصناف في خطر النفاذ؟
    2. أي الفروع تحتاج لإعادة إمداد؟
    3. نصيحة عامة لتحسين الكفاءة.

    المخزون: ${JSON.stringify(inventorySummary)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "لم يتم العثور على تحليلات.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "عذراً، حدث خطأ أثناء جلب التحليلات.";
  }
}
