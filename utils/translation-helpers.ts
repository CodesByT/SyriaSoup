import { arabicMakes, locations, makes } from "./constants";

/**
 * Translates a car make from English to Arabic or vice versa
 */
export function translateMake(
  make: string | undefined,
  toArabic: boolean
): string {
  if (!make) return "";

  if (toArabic) {
    // Find the Arabic equivalent
    const arabicMake = arabicMakes.find(
      (m) =>
        m.enValue?.toLowerCase() === make.toLowerCase() ||
        m.value?.toLowerCase() === make.toLowerCase()
    );
    return arabicMake?.label || make;
  } else {
    // Find the English equivalent
    const englishMake = makes.find(
      (m) => m.value?.toLowerCase() === make.toLowerCase()
    );
    return englishMake?.label || make;
  }
}

/**
 * Translates a car model based on make from English to Arabic or vice versa
 */
export function translateModel(
  model: string | undefined,
  make: string | undefined,
  toArabic: boolean
): string {
  if (!model || !make) return model || "";

  if (toArabic) {
    // Find the Arabic make
    const arabicMake = arabicMakes.find(
      (m) =>
        m.enValue?.toLowerCase() === make.toLowerCase() ||
        m.value?.toLowerCase() === make.toLowerCase()
    );

    // If we found the make and it has models, try to find the model
    if (arabicMake && arabicMake.models) {
      // Find the index of the model in the English make's models
      const englishMake = makes.find(
        (m) =>
          m.value?.toLowerCase() === make.toLowerCase() ||
          m.label?.toLowerCase() === make.toLowerCase()
      );

      if (englishMake && englishMake.models) {
        const modelIndex = englishMake.models.findIndex(
          (m) => m.toLowerCase() === model.toLowerCase()
        );

        // If we found the model and the Arabic make has a model at the same index
        if (modelIndex >= 0 && modelIndex < arabicMake.models.length) {
          return arabicMake.models[modelIndex];
        }
      }
    }
    return model;
  } else {
    // Similar logic for English
    const englishMake = makes.find(
      (m) =>
        m.value?.toLowerCase() === make.toLowerCase() ||
        m.label?.toLowerCase() === make.toLowerCase()
    );

    if (englishMake && englishMake.models) {
      const arabicMake = arabicMakes.find(
        (m) =>
          m.enValue?.toLowerCase() === make.toLowerCase() ||
          m.value?.toLowerCase() === make.toLowerCase()
      );

      if (arabicMake && arabicMake.models) {
        const modelIndex = arabicMake.models.findIndex(
          (m) => m.toLowerCase() === model.toLowerCase()
        );

        if (modelIndex >= 0 && modelIndex < englishMake.models.length) {
          return englishMake.models[modelIndex];
        }
      }
    }
    return model;
  }
}

/**
 * Translates a location from English to Arabic or vice versa
 */
export function translateLocation(
  location: string | undefined,
  toArabic: boolean
): string {
  if (!location) return "";

  const locationObj = locations.find(
    (loc) =>
      loc.value.toLowerCase() === location.toLowerCase() ||
      loc.label.toLowerCase() === location.toLowerCase() ||
      loc.arValue.toLowerCase() === location.toLowerCase()
  );

  if (locationObj) {
    return toArabic ? locationObj.arValue : locationObj.label;
  }

  return location;
}

/**
 * Translates common car fields like transmission, fuel type, etc.
 */
export function translateCarField(
  field: string,
  value: string | undefined,
  toArabic: boolean
): string {
  if (!value) return "";

  // Common translations for car fields
  const translations: Record<string, Record<string, string>> = {
    transmission: {
      Manual: "يدوي",
      Automatic: "أوتوماتيك",
      CVT: "سي في تي",
      "Semi-Automatic": "نصف أوتوماتيك",
    },
    fuelType: {
      Petrol: "بنزين",
      Gasoline: "بنزين",
      Diesel: "ديزل",
      Hybrid: "هجين",
      Electric: "كهربائي",
      LPG: "غاز البترول المسال",
      CNG: "الغاز الطبيعي المضغوط",
    },
    status: {
      approved: "موافق عليه",
      pending: "قيد الانتظار",
      sold: "مباع",
      rejected: "مرفوض",
      active: "نشط",
    },
    color: {
      White: "أبيض",
      Black: "أسود",
      Silver: "فضي",
      Gray: "رمادي",
      Grey: "رمادي",
      Red: "أحمر",
      Blue: "أزرق",
      Green: "أخضر",
      Yellow: "أصفر",
      Brown: "بني",
      Orange: "برتقالي",
      Purple: "بنفسجي",
      Gold: "ذهبي",
      Beige: "بيج",
    },
  };

  if (toArabic && translations[field] && translations[field][value]) {
    return translations[field][value];
  }

  return value;
}

/**
 * Translates car features from English to Arabic or vice versa
 */
export function translateFeature(
  feature: string | undefined,
  toArabic: boolean
): string {
  if (!feature) return "";

  // Feature translations mapping
  const featureTranslations: Record<string, string> = {
    // English to Arabic
    "360° Camera": "كاميرا 360 درجة",
    "Adaptive Headlights": "مصابيح أمامية تكيفية",
    "Blind Spot Warning": "تحذير النقطة العمياء",
    "Cooled Seats": "مقاعد مبردة",
    "Heated Seats": "مقاعد مدفأة",
    "LED Headlights": "مصابيح LED",
    "Performance Tyres": "إطارات عالية الأداء",
    "Sound System": "نظام صوتي",
    ABS: "نظام منع انغلاق المكابح",
    Bluetooth: "بلوتوث",
    "Extensive Tool Kit": "مجموعة أدوات شاملة",
    "Keyless Start": "تشغيل بدون مفتاح",
    "Memory Seat": "مقعد ذاكرة",
    "Reversing Camera": "كاميرا خلفية",
    "Traction Control": "نظام التحكم في الجر",
    "Active Head Restraints": "مساند رأس نشطة",
    "Blind Spot Alert": "تنبيه النقطة العمياء",
    "Forward Collision Warning": "تحذير الاصطدام الأمامي",
    "Leather Seats": "مقاعد جلدية",
    "Navigation System": "نظام الملاحة",
    "Side Airbags": "وسائد هوائية جانبية",
    "USB Port": "منفذ USB",

    // Arabic to English (reverse mapping)
    "كاميرا 360 درجة": "360° Camera",
    "مصابيح أمامية تكيفية": "Adaptive Headlights",
    "تحذير النقطة العمياء": "Blind Spot Warning",
    "مقاعد مبردة": "Cooled Seats",
    "مقاعد مدفأة": "Heated Seats",
    "مصابيح LED": "LED Headlights",
    "إطارات عالية الأداء": "Performance Tyres",
    "نظام صوتي": "Sound System",
    "نظام منع انغلاق المكابح": "ABS",
    بلوتوث: "Bluetooth",
    "مجموعة أدوات شاملة": "Extensive Tool Kit",
    "تشغيل بدون مفتاح": "Keyless Start",
    "مقعد ذاكرة": "Memory Seat",
    "كاميرا خلفية": "Reversing Camera",
    "نظام التحكم في الجر": "Traction Control",
    "مساند رأس نشطة": "Active Head Restraints",
    "تنبيه النقطة العمياء": "Blind Spot Alert",
    "تحذير الاصطدام الأمامي": "Forward Collision Warning",
    "مقاعد جلدية": "Leather Seats",
    "نظام الملاحة": "Navigation System",
    "وسائد هوائية جانبية": "Side Airbags",
    "منفذ USB": "USB Port",
  };

  // Handle translation based on direction
  if (toArabic) {
    return featureTranslations[feature] || feature;
  } else {
    return featureTranslations[feature] || feature;
  }
}

/**
 * Translates car description text
 * This would ideally use a translation service for longer text
 */
export function translateDescription(
  description: string | undefined,
  toArabic: boolean
): Promise<string> {
  if (!description) return Promise.resolve("");

  // This would connect to a translation service
  // For now, just return the original description
  return Promise.resolve(description);
}
