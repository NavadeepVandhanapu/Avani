import type { PredictionResponse } from '../types';

export interface DynamicQuestionOption {
  label: { en: string; te: string; hi: string };
  value: string;
  desc?: { en: string; te: string; hi: string };
}

export interface DynamicQuestionConfig {
  id: string;
  question: {
    en: string;
    te: string;
    hi: string;
  };
  subtitle: {
    en: string;
    te: string;
    hi: string;
  };
  options: DynamicQuestionOption[];
}

export type QuestionnaireCategory = 
  | 'healthy'
  | 'uncertain'
  | 'leaf_spot'
  | 'blight'
  | 'rust'
  | 'mildew'
  | 'viral'
  | 'general';

/**
 * Categorizes a prediction into the most relevant dynamic questionnaire type.
 */
export function getQuestionnaireCategory(prediction: PredictionResponse | null | undefined): QuestionnaireCategory {
  if (!prediction || !prediction.is_leaf_detected) {
    return 'general';
  }

  // 1. Uncertain, ambiguous, or low confidence prediction
  if (prediction.is_uncertain || prediction.confidence < 0.48 || prediction.predicted_class === 'Uncertain___Low_Confidence') {
    return 'uncertain';
  }

  // 2. Clear healthy prediction
  if (prediction.is_healthy) {
    return 'healthy';
  }

  const cls = (prediction.predicted_class || '').toLowerCase();
  const cond = (prediction.condition || '').toLowerCase();

  // 3. Rust diseases (Corn Common Rust, Cedar Apple Rust, etc.)
  if (cls.includes('rust') || cond.includes('rust')) {
    return 'rust';
  }

  // 4. Blight diseases (Early Blight, Late Blight, Northern Leaf Blight)
  if (cls.includes('blight') || cond.includes('blight')) {
    return 'blight';
  }

  // 5. Powdery Mildew, Leaf Mold, Squash Powdery Mildew
  if (cls.includes('mildew') || cond.includes('mildew') || cls.includes('mold') || cond.includes('mold')) {
    return 'mildew';
  }

  // 6. Viral conditions, leaf curl, spider mites
  if (
    cls.includes('virus') ||
    cond.includes('virus') ||
    cls.includes('curl') ||
    cond.includes('curl') ||
    cls.includes('mosaic') ||
    cond.includes('mosaic') ||
    cls.includes('spider_mites') ||
    cond.includes('mites')
  ) {
    return 'viral';
  }

  // 7. Leaf Spot, Scab, Black Rot, Esca
  if (
    cls.includes('spot') ||
    cond.includes('spot') ||
    cls.includes('scab') ||
    cond.includes('scab') ||
    cls.includes('rot') ||
    cond.includes('rot') ||
    cls.includes('measles') ||
    cond.includes('measles')
  ) {
    return 'leaf_spot';
  }

  // 8. General fallback
  return 'general';
}

/**
 * Returns a customized set of questions tailored directly to the scan result.
 */
export function getDynamicQuestions(prediction: PredictionResponse | null | undefined): DynamicQuestionConfig[] {
  const category = getQuestionnaireCategory(prediction);
  const crop = prediction?.crop || 'Crop';

  switch (category) {
    case 'healthy':
      return [
        {
          id: 'healthy_other_symptoms',
          question: {
            en: 'Have you observed any other subtle signs elsewhere on the plant?',
            te: 'మొక్కలోని ఇతర భాగాలలో ఏవైనా స్వల్ప మార్పులు గమనించారా?',
            hi: 'क्या आपने पौधे के अन्य हिस्सों में कोई हल्के लक्षण देखे हैं?'
          },
          subtitle: {
            en: 'The leaf photo appears healthy. Checking other plant parts helps catch early root or stem issues.',
            te: 'ఆకు ఆరోగ్యంగా కనిపిస్తోంది. వేర్లు లేదా కాండంలో ప్రారంభ సమస్యలను గుర్తించేందుకు ఇది ఉపయోగపడుతుంది.',
            hi: 'पत्ती स्वस्थ दिख रही है। यह जड़ों या तने की शुरुआती समस्याओं को पकड़ने में मदद करता है।'
          },
          options: [
            {
              label: {
                en: 'No other symptoms (Entire plant looks vigorous)',
                te: 'ఎలాంటి ఇతర లక్షణాలు లేవు (మొక్క చాలా ఆరోగ్యంగా ఉంది)',
                hi: 'कोई अन्य लक्षण नहीं (पूरा पौधा स्वस्थ है)'
              },
              value: 'No symptoms / Vigorous'
            },
            {
              label: {
                en: 'Subtle yellowing or pale leaves on lower stems',
                te: 'కింది ఆకులు స్వల్పంగా పసుపు రంగులోకి మారుతున్నాయి',
                hi: 'निचली पत्तियों में हल्का पीलापन'
              },
              value: 'Subtle yellowing'
            },
            {
              label: {
                en: 'Slight leaf curling or crinkling',
                te: 'ఆకులు కొద్దిగా ముడుచుకుపోతున్నాయి',
                hi: 'पत्तियों का थोड़ा मुड़ना या सिकुड़ना'
              },
              value: 'Slight leaf curling'
            },
            {
              label: {
                en: 'Slowed growth or slight wilting during hot afternoon',
                te: 'ఎదుగుదల మందగించడం లేదా మధ్యాహ్నం వేళల్లో వాడిపోవడం',
                hi: 'दोपहर की धूप में हल्का मुरझाना या धीमी वृद्धि'
              },
              value: 'Mild afternoon wilting'
            }
          ]
        },
        {
          id: 'healthy_distribution',
          question: {
            en: 'Is your inspection question for a single plant or several plants?',
            te: 'ఈ పరిశీలన ఒక్క మొక్కపైనే ఉందా లేదా అనేక మొక్కలపై ఉందా?',
            hi: 'यह निरीक्षण सिर्फ एक पौधे के लिए है या कई पौधों के लिए?'
          },
          subtitle: {
            en: 'Helps determine whether you need individual plant observation or general field monitoring.',
            te: 'ఒకే మొక్కకు పరిమితమా లేదా మొత్తం పొలాన్ని పరిశీలించాలా అని తెలుసుకునేందుకు.',
            hi: 'यह जानने के लिए कि क्या किसी एक पौधे की निगरानी करनी है या पूरे खेत की।'
          },
          options: [
            {
              label: {
                en: 'Just a single plant (Routine check)',
                te: 'ఒక్క మొక్కపైనే (సాధారణ తనిఖీ)',
                hi: 'सिर्फ एक पौधा (सामान्य जांच)'
              },
              value: 'Single plant'
            },
            {
              label: {
                en: 'A few plants scattered around the plot',
                te: 'పొలంలో అక్కడక్కడా కొన్ని మొక్కలు',
                hi: 'खेत में छिटपुट कुछ पौधे'
              },
              value: 'Few scattered plants'
            },
            {
              label: {
                en: 'Checking across the whole field / block',
                te: 'మొత్తం పొలం లేదా మడి అంతటా పరిశీలిస్తున్నాను',
                hi: 'पूरे खेत या क्यारी की जांच कर रहे हैं'
              },
              value: 'Entire field check'
            }
          ]
        },
        {
          id: 'healthy_water_stress',
          question: {
            en: 'Recent watering or weather conditions in your field?',
            te: 'ఇటీవలి నీటి పారుదల లేదా వాతావరణ పరిస్థితులు ఎలా ఉన్నాయి?',
            hi: 'हाल ही में खेत में सिंचाई या मौसम की स्थिति कैसी रही है?'
          },
          subtitle: {
            en: 'Proper moisture balance keeps healthy crops resilient against future infections.',
            te: 'సరైన తేమ సమతుల్యత పంటను తెగుళ్ళ బారిన పడకుండా కాపాడుతుంది.',
            hi: 'उचित नमी संतुलन फसल को रोगों से सुरक्षित रखता है।'
          },
          options: [
            {
              label: {
                en: 'Normal regular watering / adequate soil moisture',
                te: 'సాధారణ నీటి పారుదల / నేలలో సరిపడా తేమ ఉంది',
                hi: 'सामान्य नियमित सिंचाई / पर्याप्त नमी'
              },
              value: 'Normal drip / furrow'
            },
            {
              label: {
                en: 'Excess moisture / standing water after recent rains',
                te: 'వర్షాల వల్ల నీరు నిల్వ ఉండటం లేదా అధిక తేమ',
                hi: 'बारिश के बाद पानी का ठहराव या अत्यधिक नमी'
              },
              value: 'Heavy rain / waterlogged'
            },
            {
              label: {
                en: 'Dry spell / soil drying out quickly',
                te: 'ఎండ తీవ్రత / నేల త్వరగా ఎండిపోతోంది',
                hi: 'सूखा मौसम / मिट्टी जल्दी सूख रही है'
              },
              value: 'Dry / drought stress'
            }
          ]
        },
        {
          id: 'healthy_growth_stage',
          question: {
            en: 'What is the current growth stage of your crop?',
            te: 'పంట ప్రస్తుతం ఏ ఎదుగుదల దశలో ఉంది?',
            hi: 'आपकी फसल वर्तमान में किस विकास अवस्था में है?'
          },
          subtitle: {
            en: 'Nutrition and monitoring schedules change as crops transition to flowering and fruiting.',
            te: 'పూత మరియు కాత దశలలో పోషకాలు మరియు రక్షణ అవసరాలు మారతాయి.',
            hi: 'फूल आने और फल बनने के दौरान पोषण व निगरानी की आवश्यकताएं बदलती हैं।'
          },
          options: [
            {
              label: {
                en: 'Seedling / Early vegetative stage',
                te: 'మొలక / ప్రారంభ శాఖీయ దశ',
                hi: 'अंकुर / शुरुआती वानस्पतिक अवस्था'
              },
              value: 'Seedling / Early'
            },
            {
              label: {
                en: 'Active vegetative growth (Branching & foliage)',
                te: 'శాఖీయ పెరుగుదల (ఆకులు, కొమ్మలు)',
                hi: 'सक्रिय वानस्पतिक वृद्धि (शाखाएं व पत्तियां)'
              },
              value: 'Vegetative Growth'
            },
            {
              label: {
                en: 'Flowering Stage (Buds & blossoms)',
                te: 'పూత దశ (మొగ్గలు, పూలు)',
                hi: 'फूल आने की अवस्था'
              },
              value: 'Flowering Stage'
            },
            {
              label: {
                en: 'Fruiting / Grain filling / Maturity',
                te: 'కాత / గింజ లేదా కాయల దశ',
                hi: 'फल / दाना भरने की अवस्था'
              },
              value: 'Fruiting / Maturity'
            }
          ]
        }
      ];

    case 'uncertain':
      return [
        {
          id: 'uncertain_crop_confirm',
          question: {
            en: `Can you confirm which crop you are inspecting? (Model visual match: ${crop})`,
            te: `మీరు ఏ పంటను పరీక్షిస్తున్నారో నిర్ధారించగలరా? (నమూనా పోలిక: ${crop})`,
            hi: `क्या आप पुष्टि कर सकते हैं कि आप किस फसल की जांच कर रहे हैं? (संकेत: ${crop})`
          },
          subtitle: {
            en: 'The photo match was low confidence. Confirming the crop ensures accurate guidance.',
            te: 'ఫోటో స్పష్టత తక్కువగా ఉన్నందున, సరైన సలహాల కోసం పంటను నిర్ధారించండి.',
            hi: 'फोटो में पहचान कम निश्चित है। सटीक सलाह के लिए सही फसल चुनें।'
          },
          options: [
            { label: { en: 'Tomato', te: 'టమోటా', hi: 'टमाटर' }, value: 'Tomato' },
            { label: { en: 'Potato', te: 'బంగాళాదుంప', hi: 'आलू' }, value: 'Potato' },
            { label: { en: 'Corn / Maize', te: 'మొక్కజొన్న', hi: 'मक्का' }, value: 'Corn (Maize)' },
            { label: { en: 'Pepper / Chili', te: 'మిరప / కాప్సికం', hi: 'मिर्च / शिमला मिर्च' }, value: 'Pepper / Chili' },
            { label: { en: 'Apple', te: 'యాపిల్', hi: 'सेब' }, value: 'Apple' },
            { label: { en: 'Grape', te: 'ద్రాక్ష', hi: 'अंगूर' }, value: 'Grape' },
            { label: { en: 'Rice / Paddy', te: 'వరి', hi: 'धान / चावल' }, value: 'Rice (Paddy)' },
            { label: { en: 'Other Crop', te: 'ఇతర పంట', hi: 'अन्य फसल' }, value: 'Other' }
          ]
        },
        {
          id: 'uncertain_symptom_type',
          question: {
            en: 'What is the most visible physical symptom on the plant?',
            te: 'మొక్కపై అత్యంత స్పష్టంగా కనిపిస్తున్న భౌతిక లక్షణం ఏమిటి?',
            hi: 'पौधे पर सबसे स्पष्ट दिखाई देने वाला शारीरिक लक्षण क्या है?'
          },
          subtitle: {
            en: 'Select the primary observation you see with your own eyes in the field.',
            te: 'పొలంలో మీ కళ్ళతో చూస్తున్న ప్రధాన లక్షణాన్ని ఎంచుకోండి.',
            hi: 'खेत में अपनी आंखों से देखा जाने वाला मुख्य लक्षण चुनें।'
          },
          options: [
            {
              label: {
                en: 'Distinct brown, black, or tan spots / lesions',
                te: 'గోధుమ లేదా నల్లటి మచ్చలు',
                hi: 'भूरे, काले या गहरे धब्बे / चकत्ते'
              },
              value: 'Brown or black spots'
            },
            {
              label: {
                en: 'General yellowing or chlorosis across leaves',
                te: 'ఆకులు సాధారణంగా పసుపు రంగులోకి మారడం',
                hi: 'पत्तियों का पीला पड़ना (क्लोरोसिस)'
              },
              value: 'General yellowing'
            },
            {
              label: {
                en: 'Powdery white or grayish mold coating',
                te: 'తెల్లటి బూజు లేదా బూడిద లాంటి పొర',
                hi: 'सफेद पाउडर या फफूंद की परत'
              },
              value: 'Powdery coating'
            },
            {
              label: {
                en: 'Wilting, drooping, or dry leaf scorch',
                te: 'వాడిపోవడం లేదా ఆకులు ఎండిపోవడం',
                hi: 'पत्तियों का मुरझाना या सूखना'
              },
              value: 'Wilting / drooping'
            },
            {
              label: {
                en: 'Curled, wrinkled, or distorted new leaves',
                te: 'ఆకులు ముడుచుకుపోవడం లేదా వంకరలు తిరగడం',
                hi: 'पत्तियों का मुड़ना या विकृत होना'
              },
              value: 'Leaf curling / distortion'
            }
          ]
        },
        {
          id: 'uncertain_symptom_duration',
          question: {
            en: 'When did these symptoms first appear?',
            te: 'ఈ లక్షణాలు ఎప్పుడు మొదటిసారి కనిపించాయి?',
            hi: 'ये लक्षण सबसे पहले कब दिखाई दिए?'
          },
          subtitle: {
            en: 'Distinguishes fast-acting infections from gradual environmental stress.',
            te: 'వేగవంతమైన తెగుళ్ళను మరియు నిదానమైన వాతావరణ ఒత్తిడిని వేరు చేసేందుకు.',
            hi: 'तेजी से फैलने वाले रोगों और धीरे-धीरे होने वाले तनाव में अंतर करने के लिए।'
          },
          options: [
            {
              label: {
                en: 'Just 1 to 2 days ago (Very fresh)',
                te: '1-2 రోజుల క్రితమే (ఇప్పుడే మొదలైంది)',
                hi: 'सिर्फ 1-2 दिन पहले (बिल्कुल नया)'
              },
              value: '1-2 days ago'
            },
            {
              label: {
                en: 'About 1 week ago',
                te: 'సుమారు ఒక వారం క్రితం',
                hi: 'लगभग 1 सप्ताह पहले'
              },
              value: 'About 1 week ago'
            },
            {
              label: {
                en: 'More than 2 weeks ago',
                te: 'రెండు వారాల కంటే ఎక్కువ కాలం క్రితం',
                hi: '2 सप्ताह से अधिक समय से'
              },
              value: 'More than 2 weeks ago'
            }
          ]
        },
        {
          id: 'uncertain_spread',
          question: {
            en: 'Are the symptoms spreading to other leaves or plants?',
            te: 'ఈ లక్షణాలు ఇతర ఆకులకు లేదా పక్క మొక్కలకు పాకుతున్నాయా?',
            hi: 'क्या ये लक्षण दूसरी पत्तियों या पौधों में फैल रहे हैं?'
          },
          subtitle: {
            en: 'Indicates whether infectious spread is actively taking place.',
            te: 'తెగులు చురుకుగా వ్యాపిస్తోందో లేదో సూచిస్తుంది.',
            hi: 'यह दर्शाता है कि क्या रोग तेजी से आगे बढ़ रहा है।'
          },
          options: [
            {
              label: {
                en: 'Not spreading (Confined to same leaves)',
                te: 'వ్యాపించడం లేదు (అక్కడే ఉన్నాయి)',
                hi: 'फैल नहीं रहा (सीमित है)'
              },
              value: 'Not spreading'
            },
            {
              label: {
                en: 'Spreading slowly to adjacent foliage',
                te: 'పక్క ఆకులకు నెమ్మదిగా పాకుతున్నాయి',
                hi: 'पास की पत्तियों में धीरे-धीरे फैल रहा है'
              },
              value: 'Spreading slowly'
            },
            {
              label: {
                en: 'Spreading rapidly across rows of plants',
                te: 'చాలా వేగంగా పొలమంతా విస్తరిస్తోంది',
                hi: 'तेजी से पूरे खेत में फैल रहा है'
              },
              value: 'Spreading rapidly'
            }
          ]
        }
      ];

    case 'leaf_spot':
      return [
        {
          id: 'spot_appearance',
          question: {
            en: 'How do the spots look upon close physical examination?',
            te: 'దగ్గరగా పరిశీలించినప్పుడు ఆకులపై మచ్చలు ఎలా కనిపిస్తున్నాయి?',
            hi: 'पास से देखने पर पत्तियों पर धब्बे कैसे दिख रहे हैं?'
          },
          subtitle: {
            en: 'Concentric rings suggest fungal spots (Alternaria); water-soaked edges suggest bacterial spot.',
            te: 'వలయాల లాంటి మచ్చలు ఫంగస్‌ను, నీటి తడి అంచులు బ్యాక్టీరియాను సూచిస్తాయి.',
            hi: 'छल्लेदार धब्बे फफूंद और पानी जैसे किनारे जीवाणु संक्रमण का संकेत देते हैं।'
          },
          options: [
            {
              label: {
                en: 'Target-like concentric rings with yellow halo (Fungal)',
                te: 'వలయాలు మరియు పసుపు రంగు అంచులతో ఉన్న మచ్చలు (ఫంగస్)',
                hi: 'छल्लेदार वलय और पीले घेरे वाले धब्बे (फफूंद)'
              },
              value: 'Concentric rings (Fungal)'
            },
            {
              label: {
                en: 'Water-soaked, dark, angular spots (Bacterial)',
                te: 'నీటి తడితో కూడిన నల్లటి కోణీయ మచ్చలు (బ్యాక్టీరియా)',
                hi: 'पानी जैसे भीगे, काले कोणीय धब्बे (जीवाणु)'
              },
              value: 'Water-soaked angular spots (Bacterial)'
            },
            {
              label: {
                en: 'Tiny scattered pinhead black flecks',
                te: 'సూది మొన పరిమాణంలో చిన్న చిన్న నల్లటి చుక్కలు',
                hi: 'सूई की नोक जैसे छोटे बिखरे काले धब्बे'
              },
              value: 'Tiny pinhead flecks'
            },
            {
              label: {
                en: 'Large merging brown patches with dry centers',
                te: 'ఎండిపోయిన పెద్ద గోధుమ రంగు మచ్చలు',
                hi: 'सूखे केंद्र वाले बड़े भूरे धब्बे'
              },
              value: 'Large merging patches'
            }
          ]
        },
        {
          id: 'spot_plant_part',
          question: {
            en: 'Which part of the canopy shows the most spots?',
            te: 'మొక్కలోని ఏ భాగంలో మచ్చలు ఎక్కువగా కనిపిస్తున్నాయి?',
            hi: 'पौधे के किस हिस्से में धब्बे सबसे अधिक दिखाई दे रहे हैं?'
          },
          subtitle: {
            en: 'Soil-borne fungal spots start on lower leaves; airborne or vector issues often hit new growth.',
            te: 'నేల ద్వారా వ్యాపించేవి కింది ఆకులపై, గాలి ద్వారా వచ్చేవి పైభాగాన కనిపిస్తాయి.',
            hi: 'मिट्टी से फैलने वाले रोग निचली पत्तियों से और हवा वाले ऊपरी हिस्से से शुरू होते हैं।'
          },
          options: [
            {
              label: {
                en: 'Lower older leaves near the soil (Moving upward)',
                te: 'నేల దగ్గర ఉన్న కింది పాత ఆకులు (పైకి పాకుతున్నాయి)',
                hi: 'जमीन के पास की निचली पुरानी पत्तियां (ऊपर की ओर बढ़ रही हैं)'
              },
              value: 'Lower older leaves'
            },
            {
              label: {
                en: 'Upper young leaves and new shoots',
                te: 'పైనున్న లేత ఆకులు మరియు కొత్త చిగుళ్ళు',
                hi: 'ऊपरी नई पत्तियां और कोमल शाखाएं'
              },
              value: 'Upper young leaves'
            },
            {
              label: {
                en: 'Evenly scattered across the entire plant',
                te: 'మొక్క అంతటా సమానంగా విస్తరించి ఉన్నాయి',
                hi: 'पूरे पौधे पर समान रूप से फैले हैं'
              },
              value: 'Entire canopy'
            },
            {
              label: {
                en: 'Also visible on stems, petioles, or fruits',
                te: 'కాండం, కొమ్మలు మరియు కాయలపై కూడా ఉన్నాయి',
                hi: 'तनों, डंठलों या फलों पर भी दिख रहे हैं'
              },
              value: 'Stems and fruits affected'
            }
          ]
        },
        {
          id: 'spot_field_spread',
          question: {
            en: 'Approximately how much of your crop shows these spots?',
            te: 'పొలంలో సుమారు ఎంత శాతం పంటపై ఈ మచ్చలు కనిపిస్తున్నాయి?',
            hi: 'खेत के लगभग कितने प्रतिशत भाग में ये धब्बे दिख रहे हैं?'
          },
          subtitle: {
            en: 'Helps determine whether prompt spot pruning is enough or broader field sanitation is required.',
            te: 'కొమ్మలు కత్తిరించడం సరిపోతుందా లేదా విస్తృత రక్షణ చర్యలు అవసరమా అని నిర్ణయించేందుకు.',
            hi: 'यह तय करने के लिए कि क्या सिर्फ छंटाई काफी है या व्यापक कदम उठाने होंगे।'
          },
          options: [
            {
              label: {
                en: '< 5% (Isolated few plants)',
                te: '< 5% (చాలా తక్కువ మొక్కలు)',
                hi: '< 5% (बहुत कम पौधे)'
              },
              value: '< 5% (Isolated plants)'
            },
            {
              label: {
                en: '5% to 20% (Scattered patches in rows)',
                te: '5% నుండి 20% (కొన్ని వరుసలలో)',
                hi: '5% से 20% (पंक्तियों में छिटपुट)'
              },
              value: '5-20% (Scattered patches)'
            },
            {
              label: {
                en: '20% to 50% (Widespread across field)',
                te: '20% నుండి 50% (పొలమంతా గణనీయంగా)',
                hi: '20% से 50% (खेत में काफी फैला हुआ)'
              },
              value: '20-50% (Widespread)'
            },
            {
              label: {
                en: '> 50% (Severe infection on majority of crop)',
                te: '> 50% (సగానికి పైగా పంటలో తీవ్ర వ్యాప్తి)',
                hi: '> 50% (अधिकांश फसल में गंभीर)'
              },
              value: '> 50% (Severe)'
            }
          ]
        },
        {
          id: 'spot_spread_rate',
          question: {
            en: 'Are the leaf spots actively spreading to new leaves?',
            te: 'ఈ ఆకుమచ్చలు కొత్త ఆకులకు వేగంగా పాకుతున్నాయా?',
            hi: 'क्या ये धब्बे नई पत्तियों में तेजी से फैल रहे हैं?'
          },
          subtitle: {
            en: 'Rapid spread indicates active sporulation that requires immediate aeration and foliage drying.',
            te: 'వేగవంతమైన వ్యాప్తి ఉన్నప్పుడు తేమను తగ్గించడం మరియు గాలి ప్రసరణ పెంచడం అత్యవసరం.',
            hi: 'तेज फैलाव का मतलब है कि हवा का संचार बढ़ाना और पत्तियों को सूखा रखना तुरंत जरूरी है।'
          },
          options: [
            {
              label: {
                en: 'Stationary / Not spreading to new leaves',
                te: 'పాకడం లేదు / ఉన్న ఆకులపైనే ఉన్నాయి',
                hi: 'स्थिर है / नई पत्तियों में नहीं फैल रहा'
              },
              value: 'Not spreading'
            },
            {
              label: {
                en: 'Spreading slowly over the past week',
                te: 'గత వారం రోజులుగా నెమ్మదిగా పాకుతున్నాయి',
                hi: 'पिछले एक सप्ताह से धीरे-धीरे फैल रहा है'
              },
              value: 'Spreading slowly'
            },
            {
              label: {
                en: 'Spreading rapidly after recent rain or watering',
                te: 'వర్షం లేదా నీరు పెట్టిన తర్వాత చాలా వేగంగా పాకుతున్నాయి',
                hi: 'बारिश या सिंचाई के बाद तेजी से फैल रहा है'
              },
              value: 'Spreading rapidly'
            }
          ]
        },
        {
          id: 'spot_moisture_conditions',
          question: {
            en: 'What are your recent watering or moisture conditions?',
            te: 'ఇటీవలి నీటి పారుదల లేదా తేమ పరిస్థితులు ఎలా ఉన్నాయి?',
            hi: 'हाल ही में सिंचाई या नमी की क्या स्थिति रही है?'
          },
          subtitle: {
            en: 'Splashing water from overhead sprinklers or heavy rain spreads spore droplets to healthy leaves.',
            te: 'పైనుంచి నీళ్లు చల్లడం వల్ల తెగులు బీజాలు ఇతర ఆకులకు సులభంగా వ్యాపిస్తాయి.',
            hi: 'ऊपर से पानी का छिड़काव बीजाणुओं को स्वस्थ पत्तियों तक पहुंचाता है।'
          },
          options: [
            {
              label: {
                en: 'Overhead sprinkler splashing or recent heavy rains',
                te: 'పైనుంచి నీళ్లు చల్లడం (స్ప్రింక్లర్) లేదా భారీ వర్షాలు',
                hi: 'ऊपर से पानी का छिड़काव या भारी बारिश'
              },
              value: 'Overhead watering / heavy rain'
            },
            {
              label: {
                en: 'Drip irrigation at soil level / Furrow watering',
                te: 'డ్రిప్ పద్ధతి ద్వారా నేల మట్టంలో మాత్రమే నీరు అందించడం',
                hi: 'ड्रिप या नाली द्वारा जमीन की सतह पर सिंचाई'
              },
              value: 'Normal drip / furrow'
            },
            {
              label: {
                en: 'Dry conditions with heavy morning dew / fog',
                te: 'పొడి వాతావరణం కానీ ఉదయం వేళల్లో పొగమంచు లేదా మంచు బిందువులు',
                hi: 'सूखा मौसम लेकिन सुबह का घना कोहरा या ओस'
              },
              value: 'Morning dew / fog'
            }
          ]
        }
      ];

    case 'blight':
      return [
        {
          id: 'blight_progression',
          question: {
            en: 'How fast did these dark blighted areas develop?',
            te: 'ఈ ఆకుమాడు లేదా తెగులు మచ్చలు ఎంత వేగంగా ఏర్పడ్డాయి?',
            hi: 'ये झुलसे हुए काले धब्बे कितनी तेजी से विकसित हुए?'
          },
          subtitle: {
            en: 'Late blight develops explosive scorched areas in 2-3 cool humid days; early blight progresses gradually.',
            te: 'లేట్ బ్లైట్ చల్లని, తేమ వాతావరణంలో 2-3 రోజుల్లోనే విస్ఫోటనంలా వ్యాపిస్తుంది.',
            hi: 'पछेती झुलसा ठंडे और नम मौसम में 2-3 दिनों में बहुत तेजी से फैलता है।'
          },
          options: [
            {
              label: {
                en: 'Very rapid (Suddenly appeared in 2 to 3 days after rain/fog)',
                te: 'చాలా వేగంగా (వర్షం లేదా పొగమంచు తర్వాత 2-3 రోజుల్లోనే వచ్చింది)',
                hi: 'अत्यधिक तेज (बारिश/कोहरे के बाद 2-3 दिनों में अचानक उभरा)'
              },
              value: 'Very rapid (2-3 days)'
            },
            {
              label: {
                en: 'Gradually developed over 1 to 2 weeks',
                te: 'సుమారు 1-2 వారాలుగా నిదానంగా విస్తరించింది',
                hi: '1 से 2 सप्ताह में धीरे-धीरे विकसित हुआ'
              },
              value: 'Gradual (1-2 weeks)'
            },
            {
              label: {
                en: 'Slow / Confined to isolated patches',
                te: 'నెమ్మదిగా / కొన్ని చోట్ల మాత్రమే పరిమితమైంది',
                hi: 'धीमा / कुछ सीमित हिस्सों में'
              },
              value: 'Slow / isolated'
            }
          ]
        },
        {
          id: 'blight_plant_parts',
          question: {
            en: 'Are dark lesions also visible on stems, petioles, or fruits/tubers?',
            te: 'కాండం, కొమ్మలు లేదా కాయలు/దుంపలపై కూడా నల్లటి కుళ్ళు కనిపిస్తోందా?',
            hi: 'क्या तनों, डंठलों या फलों/कंदों पर भी काले धब्बे या सड़न दिख रही है?'
          },
          subtitle: {
            en: 'Stem lesions cause whole vine collapse; fruit rot requires immediate culling to prevent crop loss.',
            te: 'కాండంపై మచ్చలు ఉంటే కొమ్మలు విరిగిపోతాయి; కాయలు కుళ్ళిపోకుండా వెంటనే వేరు చేయాలి.',
            hi: 'तने के धब्बे पूरे पौधे को गिरा सकते हैं; फलों को सड़ने से बचाने के लिए तुरंत अलग करना जरूरी है।'
          },
          options: [
            {
              label: {
                en: 'Leaf blades only (Stems and fruits look clean)',
                te: 'ఆకులపై మాత్రమే (కాండం మరియు కాయలు బాగున్నాయి)',
                hi: 'केवल पत्तियों पर (तने और फल सुरक्षित हैं)'
              },
              value: 'Leaves only'
            },
            {
              label: {
                en: 'Stems & branches also have dark brown/black streaks',
                te: 'కాండం మరియు కొమ్మలపై నల్లటి చారలు లేదా మచ్చలు ఉన్నాయి',
                hi: 'तनों और शाखाओं पर भी काले/भूरे धब्बे हैं'
              },
              value: 'Stems and branches affected'
            },
            {
              label: {
                en: 'Fruits / tubers / ears are turning dark or rotting',
                te: 'కాయలు లేదా దుంపలు కూడా నల్లబడి కుళ్ళిపోతున్నాయి',
                hi: 'फल / कंद भी काले पड़कर सड़ रहे हैं'
              },
              value: 'Fruits / tubers rotting'
            }
          ]
        },
        {
          id: 'blight_field_extent',
          question: {
            en: 'Approximately how much of your field shows blight symptoms?',
            te: 'పొలంలో సుమారు ఎంత శాతం పంటలో ఈ తెగులు లక్షణాలు కనిపిస్తున్నాయి?',
            hi: 'खेत के लगभग कितने हिस्से में झुलसा के लक्षण दिख रहे हैं?'
          },
          subtitle: {
            en: 'Severe blights spreading across >20% of fields require urgent consultation with local KVK experts.',
            te: '20% కంటే ఎక్కువ పంటలో వ్యాపిస్తే స్థానిక కేవీకే శాస్త్రవేత్తల సలహా తప్పనిసరి.',
            hi: 'खेत में 20% से अधिक फैलाव होने पर तुरंत कृषि विज्ञान केंद्र के विशेषज्ञों से संपर्क करें।'
          },
          options: [
            {
              label: {
                en: '< 5% (Isolated few plants in low-lying spots)',
                te: '< 5% (పల్లపు ప్రదేశాల్లోని కొన్ని మొక్కలు మాత్రమే)',
                hi: '< 5% (निचले स्थानों में कुछ ही पौधे)'
              },
              value: '< 5% (Isolated plants)'
            },
            {
              label: {
                en: '5% to 20% (Scattered diseased pockets)',
                te: '5% నుండి 20% (పొలంలో అక్కడక్కడా)',
                hi: '5% से 20% (खेत में कई जगह छिटपुट)'
              },
              value: '5-20% (Scattered patches)'
            },
            {
              label: {
                en: '20% to 50% (Significant area across multiple rows)',
                te: '20% నుండి 50% (అనేక వరుసలలో వ్యాపించింది)',
                hi: '20% से 50% (कई पंक्तियों में व्यापक)'
              },
              value: '20-50% (Widespread)'
            },
            {
              label: {
                en: '> 50% (Severe widespread blight across field)',
                te: '> 50% (పొలమంతా తీవ్రంగా వ్యాపించింది)',
                hi: '> 50% (पूरे खेत में गंभीर प्रकोप)'
              },
              value: '> 50% (Severe)'
            }
          ]
        },
        {
          id: 'blight_weather',
          question: {
            en: 'Recent weather in your locality over the past 3-5 days?',
            te: 'గత 3-5 రోజులుగా మీ ప్రాంతంలో వాతావరణం ఎలా ఉంది?',
            hi: 'पिछले 3-5 दिनों में आपके इलाके में मौसम कैसा रहा है?'
          },
          subtitle: {
            en: 'Persistent cool overcast conditions and fog are primary drivers of late blight epidemics.',
            te: 'చల్లని, మేఘావృత వాతావరణం మరియు పొగమంచు తెగులు వ్యాప్తిని విపరీతంగా పెంచుతాయి.',
            hi: 'ठंडा, बादलों वाला मौसम और कोहरा इस रोग के सबसे बड़े कारण हैं।'
          },
          options: [
            {
              label: {
                en: 'Cool temperatures with persistent rain, mist, or fog',
                te: 'చల్లని వాతావరణం, వర్షం లేదా పొగమంచు ఎక్కువగా ఉంది',
                hi: 'ठंडा तापमान, लगातार बारिश या कोहरा'
              },
              value: 'Cool rain / mist / fog'
            },
            {
              label: {
                en: 'Warm days with high humidity and occasional rain',
                te: 'వేడి రోజులు కానీ అధిక తేమ మరియు అప్పుడప్పుడు వర్షం',
                hi: 'गर्म दिन, अधिक उमस और कभी-कभार बारिश'
              },
              value: 'Warm humid / showers'
            },
            {
              label: {
                en: 'Sunny and dry with clear skies',
                te: 'ఎండగా మరియు పొడిగా ఉంది',
                hi: 'धूप वाला और सूखा मौसम'
              },
              value: 'Sunny and dry'
            }
          ]
        }
      ];

    case 'rust':
      return [
        {
          id: 'rust_pustules',
          question: {
            en: 'Do you see raised pustules or powdery dust on the leaf?',
            te: 'ఆకుపై ఉబ్బిన పొక్కులు లేదా పొడి లాంటి తుప్పు మచ్చలు కనిపిస్తున్నాయా?',
            hi: 'क्या पत्ती पर उभरे हुए दाने या पाउडर जैसा तुषार/रतुआ दिख रहा है?'
          },
          subtitle: {
            en: 'Active rust produces powdery spores that rub off reddish-brown or orange onto fingers.',
            te: 'చేతితో తాకినప్పుడు వేళ్లకు ఎరుపు లేదా నారింజ రంగు పొడి అంటుకుంటుంది.',
            hi: 'छूने पर उंगलियों पर लाल-भूरे या नारंगी रंग का पाउडर लग जाता है।'
          },
          options: [
            {
              label: {
                en: 'Yes, reddish-brown/orange powder rubs off on fingers',
                te: 'అవును, వేళ్లకు ఎరుపు-గోధుమ రంగు పొడి అంటుకుంటోంది',
                hi: 'हाँ, उंगलियों पर लाल-भूरा/नारंगी पाउडर लग रहा है'
              },
              value: 'Powder rubs off (Active rust)'
            },
            {
              label: {
                en: 'Dark raised pustules that do not rub off easily',
                te: 'నల్లటి ఉబ్బిన పొక్కులు ఉన్నాయి కానీ పొడి అంటుకోవడం లేదు',
                hi: 'उभरे हुए दाने हैं लेकिन पाउडर नहीं छूट रहा'
              },
              value: 'Hard pustules'
            },
            {
              label: {
                en: 'Yellow flecks on leaf with no powdery pustules yet',
                te: 'పసుపు రంగు చుక్కలు మాత్రమే ఉన్నాయి, ఇంకా పొక్కులు రాలేదు',
                hi: 'पत्तियों पर सिर्फ पीले चकत्ते हैं, अभी दाने नहीं बने'
              },
              value: 'Early yellow flecks'
            }
          ]
        },
        {
          id: 'rust_leaf_surface',
          question: {
            en: 'Which leaf surface has the most rust pustules?',
            te: 'ఆకులోని ఏ వైపు ఎక్కువ తుప్పు పొక్కులు ఉన్నాయి?',
            hi: 'पत्ती की किस सतह पर सबसे अधिक रतुआ के दाने हैं?'
          },
          subtitle: {
            en: 'Understanding pustule placement helps distinguish common rust from southern corn rust or other blights.',
            te: 'పొక్కుల స్థానాన్ని బట్టి తెగులు రకాన్ని కచ్చితంగా గుర్తించవచ్చు.',
            hi: 'दानों की स्थिति से रोग के सही प्रकार की पहचान होती है।'
          },
          options: [
            {
              label: {
                en: 'Both upper and lower surfaces equally (Common rust)',
                te: 'ఆకు పై మరియు కింది భాగాలలో సమానంగా ఉన్నాయి',
                hi: 'ऊपरी और निचली दोनों सतहों पर समान रूप से'
              },
              value: 'Both leaf surfaces'
            },
            {
              label: {
                en: 'Almost entirely on the lower underside of the leaf',
                te: 'దాదాపు పూర్తిగా ఆకు అడుగు భాగంలోనే ఉన్నాయి',
                hi: 'लगभग पूरी तरह से पत्ती की निचली सतह पर'
              },
              value: 'Predominantly lower underside'
            },
            {
              label: {
                en: 'Predominantly on the upper sunny surface',
                te: 'ఎక్కువగా ఆకు పైభాగంలోనే ఉన్నాయి',
                hi: 'मुख्य रूप से पत्ती की ऊपरी सतह पर'
              },
              value: 'Upper surface only'
            }
          ]
        },
        {
          id: 'rust_spread',
          question: {
            en: 'Are symptoms spreading to nearby plants?',
            te: 'సమీపంలోని ఇతర మొక్కలకు కూడా ఈ తెగులు వ్యాపిస్తోందా?',
            hi: 'क्या पास के पौधों में भी यह लक्षण फैल रहा है?'
          },
          subtitle: {
            en: 'Rust spores travel rapidly on wind currents across open fields.',
            te: 'తుప్పు తెగులు బీజాలు గాలి ద్వారా పక్క మొక్కలకు వేగంగా వ్యాపిస్తాయి.',
            hi: 'रतुआ के बीजाणु हवा के झोंकों से बहुत तेजी से फैलते हैं।'
          },
          options: [
            {
              label: {
                en: 'Isolated to a few plants only',
                te: 'కొన్ని మొక్కలకు మాత్రమే పరిమితమైంది',
                hi: 'सिर्फ कुछ ही पौधों तक सीमित'
              },
              value: 'Isolated plants'
            },
            {
              label: {
                en: 'Spreading noticeably along windward direction',
                te: 'గాలి వీచే దిశలో క్రమంగా వ్యాపిస్తోంది',
                hi: 'हवा की दिशा में आगे बढ़ता हुआ दिख रहा है'
              },
              value: 'Spreading with wind'
            },
            {
              label: {
                en: 'Widespread throughout the plot',
                te: 'మడి అంతటా విస్తరించింది',
                hi: 'पूरे खेत में काफी फैल चुका है'
              },
              value: 'Widespread in plot'
            }
          ]
        },
        {
          id: 'rust_crop_stage',
          question: {
            en: 'What is the current growth stage of your crop?',
            te: 'పంట ప్రస్తుతం ఏ దశలో ఉంది?',
            hi: 'फसल इस समय किस अवस्था में है?'
          },
          subtitle: {
            en: 'Rust appearing prior to tasseling or grain filling causes highest yield loss.',
            te: 'కంకి లేదా గింజ కట్టే దశకు ముందే తుప్పు వస్తే దిగుబడి ఎక్కువగా దెబ్బతింటుంది.',
            hi: 'दाना भरने से पहले रतुआ आने पर पैदावार को सबसे अधिक नुकसान होता है।'
          },
          options: [
            {
              label: {
                en: 'Early vegetative / Knee-high stage',
                te: 'ప్రారంభ శాఖీయ దశ / మోకాలి ఎత్తు',
                hi: 'शुरुआती वानस्पतिक / घुटने तक की अवस्था'
              },
              value: 'Vegetative / Knee-high'
            },
            {
              label: {
                en: 'Tasseling / Flowering / Booting stage',
                te: 'కంకి వేసే దశ / పూత దశ',
                hi: 'मंजरी / फूल आने की अवस्था'
              },
              value: 'Flowering / Tasseling'
            },
            {
              label: {
                en: 'Grain filling / Maturity stage',
                te: 'గింజ పాలు పోసుకునే లేదా పక్వత దశ',
                hi: 'दाना भरने या पकने की अवस्था'
              },
              value: 'Grain filling / Maturity'
            }
          ]
        }
      ];

    case 'mildew':
      return [
        {
          id: 'mildew_appearance',
          question: {
            en: 'What does the fungal growth look like on the leaves?',
            te: 'ఆకులపై బూజు లేదా ఫంగస్ ఎలా కనిపిస్తోంది?',
            hi: 'पत्तियों पर फफूंद कैसी दिखाई दे रही है?'
          },
          subtitle: {
            en: 'Powdery mildew produces white talcum-like dust; downy mildew/mold produces velvety patches.',
            te: 'బూడిద తెగులు తెల్లటి పౌడర్ లా ఉంటుంది; ఆకు బూజు వెల్వెట్ లాంటి మచ్చలను ఏర్పరుస్తుంది.',
            hi: 'सफेद पाउडर जैसी फफूंद चूर्णिल आसिता है; मखमली धब्बे डाउनी मिल्ड्यू या मोल्ड होते हैं।'
          },
          options: [
            {
              label: {
                en: 'White powdery talcum-like patches on upper surface',
                te: 'ఆకు పైభాగంలో తెల్లటి టాల్కమ్ పౌడర్ లాంటి మచ్చలు',
                hi: 'ऊपरी सतह पर सफेद पाउडर जैसे चकत्ते'
              },
              value: 'White powdery coating'
            },
            {
              label: {
                en: 'Olive-green or grayish velvety mold on the underside',
                te: 'ఆకు అడుగు భాగంలో ఆలివ్-గ్రీన్ లేదా బూడిద రంగు వెల్వెట్ బూజు',
                hi: 'निचली सतह पर मखमली जैतून-हरी या भूरी फफूंद'
              },
              value: 'Velvety mold underside'
            },
            {
              label: {
                en: 'Yellow patches above with grayish fuzz underneath',
                te: 'పైభాగంలో పసుపు మచ్చలు, కింది భాగంలో బూజు',
                hi: 'ऊपर पीले धब्बे और नीचे भूरी फफूंद'
              },
              value: 'Yellowing with fuzz'
            }
          ]
        },
        {
          id: 'mildew_canopy',
          question: {
            en: 'How dense is the crop canopy and air movement?',
            te: 'పంటలో గాలి ప్రసరణ మరియు నీడ పరిస్థితులు ఎలా ఉన్నాయి?',
            hi: 'फसल में छाया और हवा का संचार कैसा है?'
          },
          subtitle: {
            en: 'Poor air circulation and shade promote rapid mold and mildew development.',
            te: 'గాలి వెలుతురు సరిగా లేకపోతే బూజు తెగుళ్ళు వేగంగా వృద్ధి చెందుతాయి.',
            hi: 'खराब हवा संचार और अत्यधिक छाया फफूंद को बढ़ावा देते हैं।'
          },
          options: [
            {
              label: {
                en: 'Very dense overcrowded foliage with little air movement',
                te: 'దట్టమైన ఆకులు, గాలి ప్రసరణ చాలా తక్కువగా ఉంది',
                hi: 'अत्यधिक घनी पत्तियां और हवा का बिल्कुल न होना'
              },
              value: 'Dense canopy / poor airflow'
            },
            {
              label: {
                en: 'Moderate foliage with reasonable spacing',
                te: 'మధ్యస్థమైన ఆకులు మరియు సరైన ఎడం ఉంది',
                hi: 'मध्यम पत्तियां और ठीक-ठाक दूरी'
              },
              value: 'Moderate canopy'
            },
            {
              label: {
                en: 'Open well-spaced rows with good aeration',
                te: 'మంచి గాలి ప్రసరణ ఉన్న విశాలమైన వరుసలు',
                hi: 'खुली पंक्तियां और अच्छा हवा संचार'
              },
              value: 'Open rows / good airflow'
            }
          ]
        },
        {
          id: 'mildew_spread',
          question: {
            en: 'How much of the canopy is showing powdery/mold patches?',
            te: 'మొక్కలో ఎంత భాగం బూజు లేదా పౌడర్ మచ్చలతో కప్పబడి ఉంది?',
            hi: 'पौधों के कितने हिस्से में यह पाउडर या फफूंद दिख रही है?'
          },
          subtitle: {
            en: 'Early infection on lower leaves can be managed by pruning before it covers upper photosynthetic leaves.',
            te: 'పై ఆకులకు చేరకముందే కింది ఆకులను కత్తిరించడం ద్వారా నివారించవచ్చు.',
            hi: 'ऊपरी पत्तियों तक पहुंचने से पहले निचली पत्तियों की छंटाई से बचाव संभव है।'
          },
          options: [
            {
              label: {
                en: '< 5% (Just a few isolated lower leaves)',
                te: '< 5% (కొన్ని కింది ఆకులపై మాత్రమే)',
                hi: '< 5% (सिर्फ निचली कुछ पत्तियां)'
              },
              value: '< 5% (Isolated leaves)'
            },
            {
              label: {
                en: '5% to 20% (Scattered across middle canopy)',
                te: '5% నుండి 20% (మధ్య భాగంలోని ఆకులపై)',
                hi: '5% से 20% (मध्यम हिस्से में)'
              },
              value: '5-20% (Scattered)'
            },
            {
              label: {
                en: '> 20% (Covering upper leaves and stems)',
                te: '> 20% (పై ఆకులు మరియు కొమ్మల వరకు వ్యాపించింది)',
                hi: '> 20% (ऊपरी पत्तियों और तनों पर फैला)'
              },
              value: '> 20% (Extensive)'
            }
          ]
        }
      ];

    case 'viral':
      return [
        {
          id: 'viral_symptoms',
          question: {
            en: 'What leaf curling or distortion do you see in the field?',
            te: 'పొలంలో ఆకులు ఎలా ముడుచుకుపోతున్నాయి లేదా మార్పు చెందుతున్నాయి?',
            hi: 'खेत में पत्तियां कैसे मुड़ या विकृत हो रही हैं?'
          },
          subtitle: {
            en: 'Upward cup curling with yellow margins is characteristic of viral infections; stippling indicates mites.',
            te: 'పైకి ముడుచుకుపోవడం వైరస్‌ను, చిన్న చిన్న చుక్కలు ఎర్ర నల్లిని సూచిస్తాయి.',
            hi: 'ऊपर की ओर मुड़ना विषाणु का और बारीक धब्बे लाल मकड़ी का संकेत हैं।'
          },
          options: [
            {
              label: {
                en: 'Upward curled / cupped leaves with yellow margins (Leaf curl)',
                te: 'పసుపు అంచులతో పైకి ముడుచుకున్న ఆకులు (ఆకుముడత వైరస్)',
                hi: 'पीले किनारों के साथ ऊपर मुड़ी पत्तियां (पत्ती मरोड़)'
              },
              value: 'Upward leaf curling'
            },
            {
              label: {
                en: 'Mottled mosaic pattern of light and dark green',
                te: 'లేత మరియు ముదురు ఆకుపచ్చ రంగుల మొజాయిక్ మచ్చలు',
                hi: 'हल्के व गहरे हरे रंग के मोज़ेक धब्बे'
              },
              value: 'Mosaic mottled pattern'
            },
            {
              label: {
                en: 'Tiny yellow speckles / fine webbing under leaves (Spider mites)',
                te: 'చిన్న పసుపు చుక్కలు మరియు ఆకు అడుగున సన్నని బూజు (ఎర్ర నల్లి)',
                hi: 'बारीक पीले धब्बे और पत्तियों के नीचे जाला (माइट्स)'
              },
              value: 'Speckles and webbing (Mites)'
            },
            {
              label: {
                en: 'Severe stunting / bushy top growth',
                te: 'మొక్క ఎదుగుదల ఆగిపోయి గుబురుగా మారడం',
                hi: 'पौधे का बढ़ना रुकना और झाड़ीनुमा होना'
              },
              value: 'Stunting and bushy growth'
            }
          ]
        },
        {
          id: 'vector_presence',
          question: {
            en: 'Have you noticed tiny whiteflies, aphids, or insects when shaking plants?',
            te: 'మొక్కలను కదిలించినప్పుడు తెల్లదోమలు, పేనుబంక లేదా చిన్న పురుగులు ఎగురుతున్నాయా?',
            hi: 'पौधों को हिलाने पर क्या सफेद मक्खी, एफिड्स या छोटे कीट उड़ते दिखते हैं?'
          },
          subtitle: {
            en: 'Whiteflies transmit curl viruses; managing the insect vector is critical to halting virus spread.',
            te: 'తెల్లదోమలు ఆకుముడత వైరస్‌ను వ్యాపింపజేస్తాయి; పురుగుల నివారణ అత్యవసరం.',
            hi: 'सफेद मक्खियां वायरस फैलाती हैं; कीट नियंत्रण ही वायरस की रोकथाम की कुंजी है।'
          },
          options: [
            {
              label: {
                en: 'Yes, clouds of tiny whiteflies fly when foliage is shaken',
                te: 'అవును, ఆకులను కదిలిస్తే తెల్లదోమలు ఎగురుతున్నాయి',
                hi: 'हाँ, पत्तियों को हिलाने पर सफेद मक्खियां उड़ती हैं'
              },
              value: 'Whiteflies present'
            },
            {
              label: {
                en: 'Clusters of aphids or small insects under younger leaves',
                te: 'లేత ఆకుల అడుగున పేనుబంక లేదా చిన్న పురుగులు ఉన్నాయి',
                hi: 'नई पत्तियों के नीचे माहू (एफिड्स) का जमावड़ा है'
              },
              value: 'Aphids present'
            },
            {
              label: {
                en: 'No visible flying insects observed',
                te: 'పురుగులేవీ కనిపించడం లేదు',
                hi: 'कोई उड़ने वाले कीट दिखाई नहीं दे रहे'
              },
              value: 'No visible vectors'
            }
          ]
        },
        {
          id: 'viral_spread',
          question: {
            en: 'How many plants show stunted growth or leaf curling?',
            te: 'ఎన్ని మొక్కలలో ఎదుగుదల లోపించడం లేదా ఆకుముడత కనిపిస్తోంది?',
            hi: 'कितने पौधों में वृद्धि रुकना या पत्तियां मुड़ना दिख रहा है?'
          },
          subtitle: {
            en: 'Severely virused young plants rarely produce yield; early roguing of a few plants protects the rest.',
            te: 'వైరస్ సోకిన మొక్కలను ప్రారంభంలోనే తొలగిస్తే మిగతా పంటను కాపాడుకోవచ్చు.',
            hi: 'शुरुआत में ही कुछ रोगग्रस्त पौधों को उखाड़कर बाकी फसल को बचाया जा सकता है।'
          },
          options: [
            {
              label: {
                en: 'Only a few scattered plants (< 5%)',
                te: 'అక్కడక్కడా కొన్ని మొక్కలు మాత్రమే (< 5%)',
                hi: 'सिर्फ कुछ छिटपुट पौधे (< 5%)'
              },
              value: '< 5% (Isolated plants)'
            },
            {
              label: {
                en: 'Scattered groups along field borders (5% - 20%)',
                te: 'పొలం గట్ల వెంబడి గుంపులుగా (5% - 20%)',
                hi: 'खेत की मेड़ों के किनारे समूह में (5% - 20%)'
              },
              value: '5-20% (Edge clusters)'
            },
            {
              label: {
                en: 'Widespread across most of the field (> 20%)',
                te: 'పొలంలో చాలా వరకు వ్యాపించింది (> 20%)',
                hi: 'खेत के अधिकांश हिस्से में (> 20%)'
              },
              value: '> 20% (Widespread)'
            }
          ]
        }
      ];

    case 'general':
    default:
      return [
        {
          id: 'q6_first_appeared',
          question: {
            en: 'When did you first notice these symptoms on your crop?',
            te: 'ఈ లక్షణాలు ఎప్పుడు మొదటిసారి గమనించారు?',
            hi: 'ये लक्षण सबसे पहले कब दिखाई दिए?'
          },
          subtitle: {
            en: 'Helps determine the speed of progression and development.',
            te: 'వ్యాధి వ్యాప్తి వేగాన్ని అంచనా వేసేందుకు ఉపయోగపడుతుంది.',
            hi: 'रोग की प्रगति की गति समझने में मदद करता है।'
          },
          options: [
            {
              label: {
                en: 'Just 1 to 2 days ago (Very fresh)',
                te: '1-2 రోజుల క్రితమే (ఇప్పుడే మొదలైంది)',
                hi: 'सिर्फ 1-2 दिन पहले (बिल्कुल नया)'
              },
              value: '1-2 days ago'
            },
            {
              label: {
                en: 'About a week ago',
                te: 'సుమారు ఒక వారం క్రితం',
                hi: 'लगभग एक सप्ताह पहले'
              },
              value: 'About 1 week ago'
            },
            {
              label: {
                en: 'More than 2 weeks ago',
                te: 'రెండు వారాల కంటే ఎక్కువ కాలం క్రితం',
                hi: '2 सप्ताह से अधिक समय से'
              },
              value: 'More than 2 weeks ago'
            }
          ]
        },
        {
          id: 'q3_field_affected',
          question: {
            en: 'Approximately how much of your field shows symptoms?',
            te: 'పొలంలో ఎంత శాతం పంటపై ఈ లక్షణాలు కనిపిస్తున్నాయి?',
            hi: 'खेत के कितने हिस्से में ये लक्षण दिख रहे हैं?'
          },
          subtitle: {
            en: 'Assesses whether the condition is localized or widespread.',
            te: 'సమస్య చిన్న స్థాయిలో ఉందా లేదా పొలమంతా విస్తరించిందా అని తెలుసుకునేందుకు.',
            hi: 'यह जानने के लिए कि समस्या सीमित है या पूरे खेत में फैल रही है।'
          },
          options: [
            {
              label: {
                en: 'Isolated (< 5% of plants)',
                te: 'చాలా తక్కువ (5% లోపు మొక్కలు)',
                hi: 'बहुत कम (5% से कम पौधे)'
              },
              value: '< 5% (Isolated plants)'
            },
            {
              label: {
                en: 'Scattered Patches (5% to 20%)',
                te: 'కొన్ని ప్యాచ్‌లలో (5% నుండి 20%)',
                hi: 'कुछ हिस्सों में (5% से 20%)'
              },
              value: '5-20% (Scattered patches)'
            },
            {
              label: {
                en: 'Widespread (20% to 50%)',
                te: 'మధ్యస్థంగా (20% నుండి 50%)',
                hi: 'मध्यम स्तर पर (20% से 50%)'
              },
              value: '20-50% (Widespread)'
            },
            {
              label: {
                en: 'Severe (> 50% of field)',
                te: 'తీవ్రంగా / సగానికి పైగా (> 50%)',
                hi: 'गंभीर / आधे से अधिक (> 50%)'
              },
              value: '> 50% (Severe)'
            }
          ]
        },
        {
          id: 'q7_spreading',
          question: {
            en: 'Are the symptoms spreading to other leaves or plants?',
            te: 'ఈ మచ్చలు ఇతర ఆకులకు లేదా పక్క మొక్కలకు పాకుతున్నాయా?',
            hi: 'क्या ये लक्षण दूसरी पत्तियों या पौधों में फैल रहे हैं?'
          },
          subtitle: {
            en: 'Crucial for deciding immediate isolation or pruning steps.',
            te: 'మొక్కలను వేరుచేయడం లేదా కొమ్మలు కత్తిరించడం నిర్ణయించేందుకు.',
            hi: 'तुरंत छंटाई या रोकथाम कदम तय करने के लिए।'
          },
          options: [
            {
              label: {
                en: 'Not spreading (Stationary on same leaves)',
                te: 'పాకడం లేదు (అక్కడే ఉన్నాయి)',
                hi: 'फैल नहीं रहा (स्थिर है)'
              },
              value: 'Not spreading'
            },
            {
              label: {
                en: 'Spreading slowly to adjacent leaves',
                te: 'పక్క ఆకులకు నెమ్మదిగా పాకుతున్నాయి',
                hi: 'पास की पत्तियों में धीरे-धीरे फैल रहा है'
              },
              value: 'Spreading slowly'
            },
            {
              label: {
                en: 'Spreading rapidly across rows',
                te: 'చాలా వేగంగా పొలమంతా విస్తరిస్తోంది',
                hi: 'तेजी से पूरे खेत में फैल रहा है'
              },
              value: 'Spreading rapidly'
            }
          ]
        },
        {
          id: 'q8_weather_watering',
          question: {
            en: 'Recent changes in weather or watering methods?',
            te: 'ఇటీవల వర్షం లేదా నీటి పారుదలలో మార్పులు ఏమైనా జరిగాయా?',
            hi: 'हाल ही में मौसम या सिंचाई में कोई बदलाव हुआ?'
          },
          subtitle: {
            en: 'Moisture and temperature drive fungal and bacterial development.',
            te: 'తేమ మరియు వర్షం తెగుళ్ళ వ్యాప్తిని పెంచుతాయి.',
            hi: 'नमी और बारिश से रोग तेजी से पनपते हैं।'
          },
          options: [
            {
              label: {
                en: 'Heavy rain, morning fog, or high humidity',
                te: 'భారీ వర్షం, పొగమంచు లేదా అధిక తేమ',
                hi: 'भारी बारिश, कोहरा या अधिक नमी'
              },
              value: 'Heavy rain / fog'
            },
            {
              label: {
                en: 'Overhead sprinkler / splash watering',
                te: 'స్ప్రింక్లర్ ద్వారా పైనుంచి నీరు చల్లడం',
                hi: 'फव्वारा / ऊपर से पानी का छिड़काव'
              },
              value: 'Overhead watering'
            },
            {
              label: {
                en: 'Normal drip irrigation / soil furrow',
                te: 'డ్రిప్ లేదా నేల ద్వారా సాధారణ నీటి పారుదల',
                hi: 'ड्रिप या नाली से सामान्य सिंचाई'
              },
              value: 'Normal drip / furrow'
            },
            {
              label: {
                en: 'Dry spell or water deficit',
                te: 'ఎండ తీవ్రత / నీటి కొరత',
                hi: 'सूखा या पानी की कमी'
              },
              value: 'Dry / drought'
            }
          ]
        }
      ];
  }
}
