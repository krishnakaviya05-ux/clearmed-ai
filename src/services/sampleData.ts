import { AnalysisResult, PreferredLanguage } from '../types/report';

export function getSampleAnalysisResult(language: PreferredLanguage = 'english'): AnalysisResult {
  const timestamp = new Date().toISOString();

  if (language === 'tamil') {
    return {
      id: 'rpt-sample-tamil-001',
      patient_name: 'ஆர். கார்த்திகேயன்',
      age: '42',
      sex: 'ஆண் (Male)',
      preferred_language: 'tamil',
      uploaded_filename: 'complete_blood_count_report.pdf',
      file_size: 245000,
      analysis_timestamp: timestamp,
      summary: {
        total_tests: 8,
        normal: 5,
        high: 1,
        low: 2,
        unknown: 0,
      },
      tests: [
        {
          id: 't-1',
          name: 'ஹீமோகுளோபின் (Hemoglobin)',
          result: '11.2',
          unit: 'g/dL',
          reference_range: '13.0 – 17.0 g/dL',
          status: 'LOW',
          explanation: 'இரத்தத்தில் சிவப்பணுக்களின் பிராணவாயு கடத்தும் புரதம் இயல்பான அளவை விட குறைவாக உள்ளது (மிதமான இரத்த சோகை அறிகுறி).',
        },
        {
          id: 't-2',
          name: 'வெள்ளை அணுக்கள் (WBC Count)',
          result: '7,400',
          unit: 'cells/mcL',
          reference_range: '4,500 – 11,000 cells/mcL',
          status: 'NORMAL',
          explanation: 'நோயெதிர்ப்பு சக்தி அணுக்கள் சரியான மற்றும் ஆரோக்கியமான வரம்பில் உள்ளன.',
        },
        {
          id: 't-3',
          name: 'இரத்த சர்க்கரை (Fasting Blood Sugar)',
          result: '138',
          unit: 'mg/dL',
          reference_range: '70 – 100 mg/dL',
          status: 'HIGH',
          explanation: 'உணவு அருந்தாத நிலையிலும் இரத்தத்தில் சர்க்கரையின் அளவு பரிந்துரைக்கப்பட்ட வரம்பை விட அதிகமாக உள்ளது.',
        },
        {
          id: 't-4',
          name: 'பிளேட்லெட் எண்ணிக்கை (Platelets)',
          result: '240,000',
          unit: '/mcL',
          reference_range: '150,000 – 450,000 /mcL',
          status: 'NORMAL',
          explanation: 'இரத்த உறைதலுக்கு உதவும் அணுக்களின் எண்ணிக்கை இயல்பாக உள்ளது.',
        },
        {
          id: 't-5',
          name: 'சீரம் ஃபெர்ரிடின் (Serum Ferritin)',
          result: '14',
          unit: 'ng/mL',
          reference_range: '24 – 336 ng/mL',
          status: 'LOW',
          explanation: 'உடலில் இரும்புச்சத்து சேமிப்பு அளவு குறைவாக உள்ளது. இது குறைந்த ஹீமோகுளோபினுடன் தொடர்புடையது.',
        },
        {
          id: 't-6',
          name: 'சீரம் கிரியேட்டினின் (Serum Creatinine)',
          result: '0.9',
          unit: 'mg/dL',
          reference_range: '0.7 – 1.3 mg/dL',
          status: 'NORMAL',
          explanation: 'சிறுநீரக செயல்பாடு ஆரோக்கியமான வரம்பில் இயங்குகிறது.',
        },
        {
          id: 't-7',
          name: 'கொலஸ்ட்ரால் (Total Cholesterol)',
          result: '185',
          unit: 'mg/dL',
          reference_range: '< 200 mg/dL',
          status: 'NORMAL',
          explanation: 'மொத்த கொழுப்பு அளவு பாதுகாப்பான வரம்பிற்குள் உள்ளது.',
        },
        {
          id: 't-8',
          name: 'தைராய்டு ஹார்மோன் (TSH)',
          result: '2.4',
          unit: 'mIU/L',
          reference_range: '0.4 – 4.0 mIU/L',
          status: 'NORMAL',
          explanation: 'தைராய்டு சுரப்பியின் இயக்கம் சரியான சமநிலையில் உள்ளது.',
        },
      ],
      abnormal_values: [
        {
          id: 't-1',
          name: 'ஹீமோகுளோபின் (Hemoglobin)',
          result: '11.2',
          unit: 'g/dL',
          reference_range: '13.0 – 17.0 g/dL',
          status: 'LOW',
          explanation: 'இரத்தத்தில் சிவப்பணுக்களின் பிராணவாயு கடத்தும் புரதம் இயல்பான அளவை விட குறைவாக உள்ளது (மிதமான இரத்த சோகை அறிகுறி).',
        },
        {
          id: 't-3',
          name: 'இரத்த சர்க்கரை (Fasting Blood Sugar)',
          result: '138',
          unit: 'mg/dL',
          reference_range: '70 – 100 mg/dL',
          status: 'HIGH',
          explanation: 'உணவு அருந்தாத நிலையிலும் இரத்தத்தில் சர்க்கரையின் அளவு பரிந்துரைக்கப்பட்ட வரம்பை விட அதிகமாக உள்ளது.',
        },
        {
          id: 't-5',
          name: 'சீரம் ஃபெர்ரிடின் (Serum Ferritin)',
          result: '14',
          unit: 'ng/mL',
          reference_range: '24 – 336 ng/mL',
          status: 'LOW',
          explanation: 'உடலில் இரும்புச்சத்து சேமிப்பு அளவு குறைவாக உள்ளது. இது குறைந்த ஹீமோகுளோபினுடன் தொடர்புடையது.',
        },
      ],
      simple_explanation: `உங்கள் மருத்துவ அறிக்கையின் முக்கிய முடிவுகள்:

1. இரத்த சிவப்பணு மற்றும் இரும்புச்சத்து (Hemoglobin & Ferritin):
உங்கள் ஹீமோகுளோபின் அளவு 11.2 g/dL ஆகவும், ஃபெர்ரிடின் 14 ng/mL ஆகவும் உள்ளது. இரண்டுமே இயல்பான வரம்பை விட குறைவு. இதனால் சோர்வு அல்லது களைப்பு ஏற்படலாம். இரும்புச்சத்து நிறைந்த உணவுகள் மற்றும் உங்கள் மருத்துவரின் ஆலோசனை அவசியம்.

2. இரத்த சர்க்கரை அளவு (Fasting Blood Sugar):
உங்கள் விரத இரத்த சர்க்கரை 138 mg/dL ஆக உள்ளது, இது இயல்பான அளவை (100 mg/dL) விட அதிகம். இது நீரிழிவு அல்லது முன்-நீரிழிவு நிலையைக் குறிக்கலாம்.

3. மற்ற முக்கிய சோதனைகள்:
வெள்ளை அணுக்கள், பிளேட்லெட்கள், சிறுநீரகம் மற்றும் கொலஸ்ட்ரால் முடிவுகள் அனைத்தும் நல்ல ஆரோக்கியமான வரம்பிற்குள் உள்ளன.

மருத்துவரிடம் விவாதிக்க வேண்டிய பரிந்துரை:
உங்கள் மருத்துவரிடம் இந்த அறிக்கையைக் காட்டி இரத்த சர்க்கரை கட்டுப்பாடு மற்றும் இரும்புச்சத்து சப்ளிமெண்ட்ஸ் பற்றி ஆலோசிக்கவும்.`,
      voice_output: [
        {
          audio_url: 'https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg',
          language_code: 'ta-IN',
          chunk_index: 1,
          total_chunks: 2,
          title: 'பகுதி 1: முக்கிய சுருக்கம் மற்றும் அசாதாரண மதிப்புகள்',
          duration_seconds: 14,
        },
        {
          audio_url: 'https://actions.google.com/sounds/v1/ambiences/water_drops.ogg',
          language_code: 'ta-IN',
          chunk_index: 2,
          total_chunks: 2,
          title: 'பகுதி 2: பரிந்துரைகள் மற்றும் மருத்துவ கவனிப்பு',
          duration_seconds: 18,
        },
      ],
    };
  }

  if (language === 'hindi') {
    return {
      id: 'rpt-sample-hindi-001',
      patient_name: 'अमित कुमार शर्मा',
      age: '42',
      sex: 'पुरुष (Male)',
      preferred_language: 'hindi',
      uploaded_filename: 'complete_blood_count_report.pdf',
      file_size: 245000,
      analysis_timestamp: timestamp,
      summary: {
        total_tests: 8,
        normal: 5,
        high: 1,
        low: 2,
        unknown: 0,
      },
      tests: [
        {
          id: 't-1',
          name: 'हीमोग्लोबिन (Hemoglobin)',
          result: '11.2',
          unit: 'g/dL',
          reference_range: '13.0 – 17.0 g/dL',
          status: 'LOW',
          explanation: 'लाल रक्त कोशिकाओं में ऑक्सीजन ले जाने वाला प्रोटीन सामान्य सीमा से कम पाया गया है।',
        },
        {
          id: 't-2',
          name: 'श्वेत रक्त कोशिकाएं (WBC Count)',
          result: '7,400',
          unit: 'cells/mcL',
          reference_range: '4,500 – 11,000 cells/mcL',
          status: 'NORMAL',
          explanation: 'संक्रमण से लड़ने वाली कोशिकाएं पूरी तरह से स्वस्थ सीमा में हैं।',
        },
        {
          id: 't-3',
          name: 'फास्टिंग ब्लड शुगर (Fasting Blood Sugar)',
          result: '138',
          unit: 'mg/dL',
          reference_range: '70 – 100 mg/dL',
          status: 'HIGH',
          explanation: 'खाली पेट रक्त शर्करा का स्तर सामान्य सीमा से अधिक है, जो सावधानी बरतने का संकेत है।',
        },
        {
          id: 't-4',
          name: 'प्लेटलेट्स (Platelets)',
          result: '240,000',
          unit: '/mcL',
          reference_range: '150,000 – 450,000 /mcL',
          status: 'NORMAL',
          explanation: 'रक्त के थक्के जमने में मदद करने वाली प्लेटलेट्स की संख्या सामान्य है।',
        },
        {
          id: 't-5',
          name: 'सीरम फेरिटिन (Serum Ferritin)',
          result: '14',
          unit: 'ng/mL',
          reference_range: '24 – 336 ng/mL',
          status: 'LOW',
          explanation: 'शरीर में आयरन का संचित स्तर कम है। यह हीमोग्लोबिन में कमी का प्राथमिक कारण हो सकता है।',
        },
        {
          id: 't-6',
          name: 'सीरम क्रिएटिनिन (Serum Creatinine)',
          result: '0.9',
          unit: 'mg/dL',
          reference_range: '0.7 – 1.3 mg/dL',
          status: 'NORMAL',
          explanation: 'गुर्दे (किडनी) का कार्य पूरी तरह से सामान्य और स्वस्थ है।',
        },
        {
          id: 't-7',
          name: 'कुल कोलेस्ट्रॉल (Total Cholesterol)',
          result: '185',
          unit: 'mg/dL',
          reference_range: '< 200 mg/dL',
          status: 'NORMAL',
          explanation: 'रक्त में कोलेस्ट्रॉल की मात्रा सुरक्षित सीमा में है।',
        },
        {
          id: 't-8',
          name: 'थायराइड उत्तेजक हार्मोन (TSH)',
          result: '2.4',
          unit: 'mIU/L',
          reference_range: '0.4 – 4.0 mIU/L',
          status: 'NORMAL',
          explanation: 'थायराइड ग्रंथि का कार्य संतुलित है।',
        },
      ],
      abnormal_values: [
        {
          id: 't-1',
          name: 'हीमोग्लोबिन (Hemoglobin)',
          result: '11.2',
          unit: 'g/dL',
          reference_range: '13.0 – 17.0 g/dL',
          status: 'LOW',
          explanation: 'लाल रक्त कोशिकाओं में ऑक्सीजन ले जाने वाला प्रोटीन सामान्य सीमा से कम पाया गया है।',
        },
        {
          id: 't-3',
          name: 'फास्टिंग ब्लड शुगर (Fasting Blood Sugar)',
          result: '138',
          unit: 'mg/dL',
          reference_range: '70 – 100 mg/dL',
          status: 'HIGH',
          explanation: 'खाली पेट रक्त शर्करा का स्तर सामान्य सीमा से अधिक है, जो सावधानी बरतने का संकेत है।',
        },
        {
          id: 't-5',
          name: 'सीरम फेरिटिन (Serum Ferritin)',
          result: '14',
          unit: 'ng/mL',
          reference_range: '24 – 336 ng/mL',
          status: 'LOW',
          explanation: 'शरीर में आयरन का संचित स्तर कम है। यह हीमोग्लोबिन में कमी का प्राथमिक कारण हो सकता है।',
        },
      ],
      simple_explanation: `आपकी मेडिकल रिपोर्ट का सरल विवरण:

1. हीमोग्लोबिन और आयरन भंडार (Hemoglobin & Ferritin):
आपकी रिपोर्ट में हीमोग्लोबिन 11.2 g/dL और फेरिटिन 14 ng/mL है। यह दोनों सामान्य स्तर से कम हैं। इसके कारण शरीर में हल्की थकान या कमजोरी महसूस हो सकती है।

2. ब्लड शुगर (Blood Sugar):
फास्टिंग शुगर का स्तर 138 mg/dL है, जो सामान्य 100 mg/dL से ऊपर है। यह प्रीडायबिटीज या डायबिटीज का संकेत हो सकता है।

3. अन्य परीक्षण:
सफेद रक्त कोशिकाएं (WBC), प्लेटलेट्स, गुर्दे का स्वास्थ्य (Creatinine) और कोलेस्ट्रॉल सामान्य और सुरक्षित दायरे में हैं।

अगला कदम:
कृपया इन परिणामों के बारे में अपने चिकित्सक (Doctor) से परामर्श करें ताकि आहार और उपचार की योजना बनाई जा सके।`,
      voice_output: [
        {
          audio_url: 'https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg',
          language_code: 'hi-IN',
          chunk_index: 1,
          total_chunks: 2,
          title: 'भाग 1: रिपोर्ट सारांश और महत्वपूर्ण परिणाम',
          duration_seconds: 14,
        },
        {
          audio_url: 'https://actions.google.com/sounds/v1/ambiences/water_drops.ogg',
          language_code: 'hi-IN',
          chunk_index: 2,
          total_chunks: 2,
          title: 'भाग 2: असामान्य मान और डॉक्टर से परामर्श',
          duration_seconds: 18,
        },
      ],
    };
  }

  // Default English
  return {
    id: 'rpt-sample-en-001',
    patient_name: 'Robert M. Vance',
    age: '42',
    sex: 'Male',
    preferred_language: 'english',
    uploaded_filename: 'complete_blood_count_report.pdf',
    file_size: 245000,
    analysis_timestamp: timestamp,
    summary: {
      total_tests: 8,
      normal: 5,
      high: 1,
      low: 2,
      unknown: 0,
    },
    tests: [
      {
        id: 't-1',
        name: 'Hemoglobin',
        result: '11.2',
        unit: 'g/dL',
        reference_range: '13.0 – 17.0 g/dL',
        status: 'LOW',
        explanation: 'The oxygen-carrying protein in your red blood cells is slightly below normal range. This pattern is commonly linked to mild anemia or iron depletion.',
      },
      {
        id: 't-2',
        name: 'White Blood Cell Count (WBC)',
        result: '7,400',
        unit: 'cells/mcL',
        reference_range: '4,500 – 11,000 cells/mcL',
        status: 'NORMAL',
        explanation: 'Your immune defense cells are within a standard healthy range, indicating no acute infection.',
      },
      {
        id: 't-3',
        name: 'Fasting Blood Glucose',
        result: '138',
        unit: 'mg/dL',
        reference_range: '70 – 99 mg/dL',
        status: 'HIGH',
        explanation: 'Your blood sugar level after fasting is elevated above the standard threshold (100 mg/dL). This warrants discussion regarding glucose regulation.',
      },
      {
        id: 't-4',
        name: 'Platelet Count',
        result: '240,000',
        unit: '/mcL',
        reference_range: '150,000 – 450,000 /mcL',
        status: 'NORMAL',
        explanation: 'Cells responsible for normal blood clotting are at a stable and healthy concentration.',
      },
      {
        id: 't-5',
        name: 'Serum Ferritin',
        result: '14',
        unit: 'ng/mL',
        reference_range: '24 – 336 ng/mL',
        status: 'LOW',
        explanation: 'Ferritin measures stored iron in the body. The low level correlates directly with the decreased hemoglobin finding.',
      },
      {
        id: 't-6',
        name: 'Serum Creatinine',
        result: '0.9',
        unit: 'mg/dL',
        reference_range: '0.7 – 1.3 mg/dL',
        status: 'NORMAL',
        explanation: 'Kidney filtration marker is well within typical parameters, indicating intact kidney function.',
      },
      {
        id: 't-7',
        name: 'Total Cholesterol',
        result: '185',
        unit: 'mg/dL',
        reference_range: '< 200 mg/dL',
        status: 'NORMAL',
        explanation: 'Total circulating blood cholesterol is within the desirable standard range.',
      },
      {
        id: 't-8',
        name: 'Thyroid Stimulating Hormone (TSH)',
        result: '2.4',
        unit: 'mIU/L',
        reference_range: '0.4 – 4.0 mIU/L',
        status: 'NORMAL',
        explanation: 'Thyroid gland regulatory hormone is balanced and functioning properly.',
      },
    ],
    abnormal_values: [
      {
        id: 't-1',
        name: 'Hemoglobin',
        result: '11.2',
        unit: 'g/dL',
        reference_range: '13.0 – 17.0 g/dL',
        status: 'LOW',
        explanation: 'The oxygen-carrying protein in your red blood cells is slightly below normal range. This pattern is commonly linked to mild anemia or iron depletion.',
      },
      {
        id: 't-3',
        name: 'Fasting Blood Glucose',
        result: '138',
        unit: 'mg/dL',
        reference_range: '70 – 99 mg/dL',
        status: 'HIGH',
        explanation: 'Your blood sugar level after fasting is elevated above the standard threshold (100 mg/dL). This warrants discussion regarding glucose regulation.',
      },
      {
        id: 't-5',
        name: 'Serum Ferritin',
        result: '14',
        unit: 'ng/mL',
        reference_range: '24 – 336 ng/mL',
        status: 'LOW',
        explanation: 'Ferritin measures stored iron in the body. The low level correlates directly with the decreased hemoglobin finding.',
      },
    ],
    simple_explanation: `Key Findings From Your Laboratory Report:

1. Red Blood Cell & Iron Status:
Your Hemoglobin is measured at 11.2 g/dL (normal range 13.0–17.0) and Serum Ferritin is at 14 ng/mL (normal range 24–336). Both values are lower than standard reference intervals. This combination frequently indicates low iron stores which can lead to fatigue or decreased stamina.

2. Blood Glucose Level:
Your fasting blood sugar is 138 mg/dL, which is above the expected fasting target of under 100 mg/dL. Elevated fasting glucose suggests your body may be having trouble regulating sugar effectively.

3. Healthy / Stable Results:
Your immune defense indicators (White Blood Cells), clotting factors (Platelets), renal filtration (Creatinine), and thyroid gland regulatory hormones are all within normal ranges.

Recommended Next Step:
Bring this report to your physician or primary care provider. They can evaluate your iron intake, dietary needs, and order confirmatory blood glucose checks (such as an HbA1c test) if appropriate.`,
    voice_output: [
      {
        audio_url: 'https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg',
        language_code: 'en-US',
        chunk_index: 1,
        total_chunks: 2,
        title: 'Section 1: Summary of Blood Findings and Abnormal Values',
        duration_seconds: 15,
      },
      {
        audio_url: 'https://actions.google.com/sounds/v1/ambiences/water_drops.ogg',
        language_code: 'en-US',
        chunk_index: 2,
        total_chunks: 2,
        title: 'Section 2: Recommended Follow-Up with Healthcare Provider',
        duration_seconds: 19,
      },
    ],
  };
}
