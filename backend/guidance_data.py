"""
Avani Curated Agricultural Disease Guidance Database
Ground truth references compiled from ICAR, FAO, and university extension services.
Strictly follows safety guidelines: No arbitrary chemical prescriptions or invented dosages.
"""

GUIDANCE_DATABASE = {
    "Tomato___Early_blight": {
        "crop": "Tomato",
        "condition": "Early Blight",
        "scientific_name": "Alternaria solani",
        "category": "Fungal",
        "plain_summary": "Early blight is a common fungal issue that usually starts on older, lower leaves as dark brown spots with concentric target-like rings.",
        "visible_symptoms": [
            "Dark brown or black spots on lower leaves with concentric ring patterns (like a bullseye).",
            "Yellow halo or yellowing area surrounding the dark spots.",
            "Lower leaves drying up and dropping prematurely.",
            "Dark, sunken spots near the stem end of fruits if infection progresses."
        ],
        "what_to_check_now": [
            "Examine the lowest leaves closest to the damp soil — this is where symptoms usually begin.",
            "Check if lesions have characteristic target-board circular rings.",
            "Carefully pluck off and safely discard heavily spotted lower leaves away from the field.",
            "Ensure leaves do not touch wet soil; consider staking or mulching around base."
        ],
        "what_to_monitor": [
            "Check whether yellow halos around spots are expanding over the next 2 to 3 days.",
            "Observe if spots are spreading upward from lower leaves to middle foliage.",
            "Watch after rain or heavy morning dew, as humidity accelerates fungal sporulation.",
            "Inspect neighboring tomato plants in the same row."
        ],
        "when_to_seek_help": [
            "If more than 15-20% of plant leaves show active dark spots.",
            "If spots begin appearing directly on green fruits or main stems.",
            "If symptoms continue spreading rapidly despite removing lower infected leaves.",
            "Consult your local Krishi Vigyan Kendra (KVK) or agricultural officer for approved regional fungicide guidance."
        ],
        "timeline_actions": [
            {"period": "Today", "task": "Prune and dispose of severely infected bottom leaves in a pit, away from the crop."},
            {"period": "Today", "task": "Clean and wipe pruning shears with soap or disinfectant after each plant."},
            {"period": "Next 2-3 Days", "task": "Switch to base or drip irrigation to keep leaf canopy dry during watering."},
            {"period": "Next 2-3 Days", "task": "Inspect adjacent plants in the row for early yellowing or bullseye spots."},
            {"period": "After 5 Days", "task": "If spots spread to new growth, take a leaf sample to the local agricultural extension office."}
        ],
        "safety_note": "Do not spray unverified chemical fungicides without local agronomist confirmation. Keep leaves dry during irrigation."
    },
    "Tomato___Late_blight": {
        "crop": "Tomato",
        "condition": "Late Blight",
        "scientific_name": "Phytophthora infestans",
        "category": "Oomycete / Water Mold",
        "plain_summary": "Late blight is a fast-moving moisture-driven condition causing pale water-soaked patches that turn dark brown with white fuzzy mold underneath in cool, wet weather.",
        "visible_symptoms": [
            "Large, irregular water-soaked pale green or brown patches on leaves.",
            "Delicate white fuzzy fungal growth on the underside of leaves during humid mornings.",
            "Dark brown greasy-looking lesions on stems.",
            "Firm, brown, leathery patches on green and ripe fruits."
        ],
        "what_to_check_now": [
            "Turn affected leaves over to inspect for white cottony growth on the underside.",
            "Check main stems for dark brown girdling patches.",
            "Inspect fruits for firm, bumpy brown discoloration.",
            "Identify if affected plants are in low-lying, poorly drained field corners."
        ],
        "what_to_monitor": [
            "Inspect daily in cool (15-22°C), foggy, or rainy weather as late blight can spread across a field within 3-5 days.",
            "Observe if lesions turn from pale green to dark brown/black rapidly.",
            "Watch for rapid wilting or collapse of entire leaf branches."
        ],
        "when_to_seek_help": [
            "Immediate alert: Late blight spreads rapidly across whole fields and nearby farms.",
            "Contact your block agricultural development officer immediately if white mold is seen on leaf undersides.",
            "Seek community advisory if neighboring tomato or potato fields show similar sudden collapse."
        ],
        "timeline_actions": [
            {"period": "Today", "task": "Isolate the area; avoid walking through wet infected rows to prevent spore transfer."},
            {"period": "Today", "task": "Remove completely collapsed branches and bag them immediately."},
            {"period": "Next 2-3 Days", "task": "Check entire plot twice daily during overcast or rainy weather."},
            {"period": "After 5 Days", "task": "Review field recovery with an authorized agricultural extension worker."}
        ],
        "safety_note": "Late blight is highly contagious across potato and tomato crops. Prompt inspection and community notification are essential."
    },
    "Tomato___Bacterial_spot": {
        "crop": "Tomato",
        "condition": "Bacterial Spot",
        "scientific_name": "Xanthomonas spp.",
        "category": "Bacterial",
        "plain_summary": "Bacterial spot causes small, dark, water-soaked specks on leaves and scabby raised spots on fruits during warm, rainy periods.",
        "visible_symptoms": [
            "Small (less than 3mm), dark brown or black water-soaked spots.",
            "Leaf spots often surrounded by a narrow yellow halo.",
            "Severe spotting leads to leaf yellowing and shedding (defoliation).",
            "Small, raised, scab-like blister spots on tomato fruits."
        ],
        "what_to_check_now": [
            "Inspect both young and old leaves for tiny speckling rather than large rings.",
            "Check if spots feel slightly greasy or water-soaked when backlit by sunlight.",
            "Avoid touching plants while foliage is wet from rain or dew."
        ],
        "what_to_monitor": [
            "Check if warm rainy winds cause spots to spread downwind in the field.",
            "Monitor fruit surfaces for rough, corky blemishes.",
            "Observe whether new top shoots are emerging spot-free."
        ],
        "when_to_seek_help": [
            "If severe leaf drop leaves tomatoes exposed to direct sun scald.",
            "If more than 25% of developing fruits show scabby lesions.",
            "Consult local agricultural extension for recommended copper-based bactericide management."
        ],
        "timeline_actions": [
            {"period": "Today", "task": "Avoid handling or weeding near wet plants to prevent bacterial spread."},
            {"period": "Next 2-3 Days", "task": "Ensure field drainage is clear so water does not pool around roots."},
            {"period": "After 5 Days", "task": "Check if new leaves remain clean after dry weather returns."}
        ],
        "safety_note": "Bacterial diseases cannot be treated with standard fungal sprays. Always seek certified extension advice."
    },
    "Tomato___Septoria_leaf_spot": {
        "crop": "Tomato",
        "condition": "Septoria Leaf Spot",
        "scientific_name": "Septoria lycopersici",
        "category": "Fungal",
        "plain_summary": "Septoria causes numerous tiny circular spots with grey centers and dark borders on lower foliage, progressing upward.",
        "visible_symptoms": [
            "Numerous circular spots (2-4mm) with light grey/tan centers and distinct dark brown borders.",
            "Tiny black specks (spore bodies) visible inside the grey center under close inspection.",
            "Leaves turn yellow around spots and eventually drop off, starting from the ground up."
        ],
        "what_to_check_now": [
            "Check the centers of spots on lower leaves for tiny dark specks inside the grey patch.",
            "Collect fallen yellow leaves from the soil and destroy them safely.",
            "Apply straw mulch over the soil to stop rain droplets from splashing fungal spores upward."
        ],
        "what_to_monitor": [
            "Track if spotting is remaining confined to lower 30cm of the plant or climbing upward.",
            "Monitor after overhead irrigation or heavy downpours."
        ],
        "when_to_seek_help": [
            "If the plant loses more than half its foliage before fruits mature.",
            "If you need an approved plant protection schedule from your local agronomist."
        ],
        "timeline_actions": [
            {"period": "Today", "task": "Clear fallen dry leaves from under the plant canopy."},
            {"period": "Next 2-3 Days", "task": "Apply dry mulch (straw or dry grass) to prevent soil-splash onto lower leaves."},
            {"period": "After 5 Days", "task": "Inspect newly formed upper leaves to confirm they stay spot-free."}
        ],
        "safety_note": "Mulching the soil surface is one of the most effective physical barriers against Septoria splash spread."
    },
    "Tomato___Yellow_Leaf_Curl_Virus": {
        "crop": "Tomato",
        "condition": "Yellow Leaf Curl Virus",
        "scientific_name": "Tomato yellow leaf curl virus (TYLCV)",
        "category": "Viral (Whitefly Vector)",
        "plain_summary": "A virus transmitted by tiny whiteflies causing severe upward curling, yellow leaf margins, and stunted plant growth.",
        "visible_symptoms": [
            "Upward curling and cupping of leaflets into boat shapes.",
            "Marked yellowing (chlorosis) along leaf borders and interveinal areas.",
            "Stunted, bushy plant appearance with shortened internodes.",
            "Heavy drop of flowers leading to few or no fruits."
        ],
        "what_to_check_now": [
            "Gently shake the plant and observe if tiny white insects (whiteflies) flutter around.",
            "Inspect upper growing tips where curling and yellowing are most prominent.",
            "Check field borders for weed hosts where whiteflies may breed."
        ],
        "what_to_monitor": [
            "Monitor yellow sticky traps in the field to assess whitefly density.",
            "Check neighboring plants for early upward cupping of youngest leaves."
        ],
        "when_to_seek_help": [
            "If whitefly populations are high across the field.",
            "Seek extension advice on integrated vector management and resistant variety selection for subsequent seasons."
        ],
        "timeline_actions": [
            {"period": "Today", "task": "Install yellow sticky sheets near crop canopy level to trap flying whiteflies."},
            {"period": "Today", "task": "Remove weeds around field bunds that serve as alternate insect hosts."},
            {"period": "Next 2-3 Days", "task": "Inspect new shoot tips for curling."}
        ],
        "safety_note": "Viruses cannot be cured once inside the plant. Management focuses on controlling the whitefly vector and removing weed reservoirs."
    },
    "Tomato___healthy": {
        "crop": "Tomato",
        "condition": "Healthy Plant",
        "scientific_name": "Solanum lycopersicum",
        "category": "Healthy",
        "plain_summary": "The tomato leaf shows vibrant, uniform green coloring, smooth texture, and no visible signs of active blight, spot, or pest distress.",
        "visible_symptoms": [
            "Even green color across leaf surface.",
            "No dark concentric rings, water-soaked patches, or yellow halos.",
            "Crisp, well-formed leaf edges without abnormal cupping or curling."
        ],
        "what_to_check_now": [
            "Continue standard watering schedule at root level.",
            "Ensure regular air circulation between plant rows.",
            "Inspect lower leaves once weekly during humid or rainy weather."
        ],
        "what_to_monitor": [
            "Monitor soil moisture so roots remain aerated without waterlogging.",
            "Check for any sudden changes after unexpected weather shifts."
        ],
        "when_to_seek_help": [
            "No immediate help needed for healthy foliage.",
            "Contact extension officers for seasonal nutrition or balanced fertilizer recommendations."
        ],
        "timeline_actions": [
            {"period": "Today", "task": "Maintain regular weeding and clean soil hygiene around stems."},
            {"period": "Next 2-3 Days", "task": "Ensure consistent morning watering at root zone."}
        ],
        "safety_note": "Maintaining good airflow and clean field bunds keeps healthy plants resilient against seasonal pathogens."
    },
    "Potato___Early_blight": {
        "crop": "Potato",
        "condition": "Early Blight",
        "scientific_name": "Alternaria solani",
        "category": "Fungal",
        "plain_summary": "Early blight produces brown angular spots with concentric rings on older potato leaves, weakening tuber filling if left unmanaged.",
        "visible_symptoms": [
            "Brown angular spots restricted by leaf veins on lower foliage.",
            "Concentric ring pattern visible inside mature spots.",
            "Leaves turn yellow around spots and die back prematurely."
        ],
        "what_to_check_now": [
            "Inspect lower canopy leaves touching the soil ridges.",
            "Check for nutrient stress or drought stress which makes potato plants more susceptible.",
            "Ensure soil hilling covers developing tubers securely."
        ],
        "what_to_monitor": [
            "Observe if spots remain on lower 20% of canopy or move toward top flowers.",
            "Check field after warm periods followed by dew or light rain."
        ],
        "when_to_seek_help": [
            "If defoliation begins during tuber bulking stage.",
            "Consult local potato agronomist for approved protective schedules."
        ],
        "timeline_actions": [
            {"period": "Today", "task": "Remove severely dried lower foliage to lower spore levels."},
            {"period": "Next 2-3 Days", "task": "Irrigate in the early morning so leaves dry quickly in sunlight."}
        ],
        "safety_note": "Balanced nitrogen and potassium nutrition helps potato plants resist early blight stress."
    },
    "Potato___Late_blight": {
        "crop": "Potato",
        "condition": "Late Blight",
        "scientific_name": "Phytophthora infestans",
        "category": "Oomycete / Water Mold",
        "plain_summary": "A destructive water-mold disease that causes rapid rotting of potato foliage and tubers during cold, wet, foggy conditions.",
        "visible_symptoms": [
            "Irregular pale green to brown water-soaked lesions on leaves and stems.",
            "Faint white fungal growth on leaf undersides in early morning dampness.",
            "Rapid browning and collapse of entire leaf clusters.",
            "Brown, granular dry rot penetrating into tubers under the skin."
        ],
        "what_to_check_now": [
            "Inspect lowest field areas where fog lingers longest.",
            "Check leaf undersides before sun dries the morning dew.",
            "Ensure tubers in ground are well-covered with soil to prevent spore wash-down."
        ],
        "what_to_monitor": [
            "Inspect daily if daytime temperatures are between 12-20°C with persistent drizzle or fog.",
            "Monitor for rapid foliage collapse across rows."
        ],
        "when_to_seek_help": [
            "Immediate alert: Late blight can destroy a potato plot within a week.",
            "Notify local agricultural extension service without delay."
        ],
        "timeline_actions": [
            {"period": "Today", "task": "Inspect entire potato field row by row; isolate affected patches."},
            {"period": "Next 2-3 Days", "task": "Do not irrigate by sprinkler; keep soil ridges well covered over tubers."}
        ],
        "safety_note": "Do not leave diseased potato tubers in the field or compost pile as they carry blight to the next planting season."
    },
    "Potato___healthy": {
        "crop": "Potato",
        "condition": "Healthy Crop",
        "scientific_name": "Solanum tuberosum",
        "category": "Healthy",
        "plain_summary": "The potato foliage is vigorous, dark green, and free from blight lesions or wilting.",
        "visible_symptoms": [
            "Deep green leaves with uniform surface.",
            "No water-soaked spots, necrosis, or white fungal fuzz.",
            "Sturdy stems supporting upright canopy."
        ],
        "what_to_check_now": [
            "Ensure potato ridges are well-earthed up so tubers are protected from sunlight and pests.",
            "Keep furrows weed-free."
        ],
        "what_to_monitor": [
            "Monitor weather forecasts for sudden cold rainy spells."
        ],
        "when_to_seek_help": [
            "No urgent intervention required."
        ],
        "timeline_actions": [
            {"period": "Today", "task": "Check soil moisture in furrows and maintain good drainage."}
        ],
        "safety_note": "Keep soil ridging high to protect tubers from greening and rain-borne spores."
    },
    "Corn___Common_rust": {
        "crop": "Corn (Maize)",
        "condition": "Common Rust",
        "scientific_name": "Puccinia sorghi",
        "category": "Fungal",
        "plain_summary": "Common rust causes raised, reddish-brown pustules scattered across both upper and lower corn leaf surfaces.",
        "visible_symptoms": [
            "Small, powdery, oval to elongate reddish-brown pustules on both leaf surfaces.",
            "Rusty powder rubs off onto fingers when pustules are touched.",
            "Pustules turn brownish-black late in the season.",
            "Severe infection can cause leaf chlorosis and premature drying."
        ],
        "what_to_check_now": [
            "Rub your finger gently over the brown spots to see if reddish rust spores detach.",
            "Check if rust pustules appear on upper leaves near the developing corn ear.",
            "Check air humidity and night-time dew periods in the field."
        ],
        "what_to_monitor": [
            "Monitor whether rust spreads from lower leaves up to the critical ear-leaf zone.",
            "Check weather: rust develops fastest in moderate temperatures (16-25°C) with high humidity."
        ],
        "when_to_seek_help": [
            "If rust covers leaves at or above the primary ear leaf before grain filling completes.",
            "Consult agricultural officer for hybrid tolerance information."
        ],
        "timeline_actions": [
            {"period": "Today", "task": "Inspect ear leaves on 10 random plants across the field."},
            {"period": "Next 2-3 Days", "task": "Keep field free of dense volunteer weeds to promote airflow."}
        ],
        "safety_note": "Most modern hybrid corn varieties have moderate tolerance; treatment is only considered if ear leaves are threatened early in grain fill."
    },
    "Corn___Northern_Leaf_Blight": {
        "crop": "Corn (Maize)",
        "condition": "Northern Corn Leaf Blight",
        "scientific_name": "Setosphaeria turcica",
        "category": "Fungal",
        "plain_summary": "Northern leaf blight produces large, long, cigar-shaped greyish-green or tan lesions on corn leaves.",
        "visible_symptoms": [
            "Long, elliptical, cigar-shaped lesions (2.5 to 15 cm long).",
            "Lesions start greyish-green and turn tan or brown as tissue dies.",
            "Dark, fuzzy fungal spores appear inside lesions during damp weather."
        ],
        "what_to_check_now": [
            "Measure length of spots — northern blight lesions are characteristically long and cigar-shaped.",
            "Check lower canopy leaves first, where humidity remains trapped."
        ],
        "what_to_monitor": [
            "Monitor vertical progression towards the ear leaf during tasseling and silking.",
            "Watch for lesion coalescing into large dead leaf areas."
        ],
        "when_to_seek_help": [
            "If lesions appear on the ear leaf before pollination completes."
        ],
        "timeline_actions": [
            {"period": "Today", "task": "Map out affected rows to understand if blight is localized."},
            {"period": "Next 2-3 Days", "task": "Ensure adequate field drainage to reduce lingering canopy moisture."}
        ],
        "safety_note": "Crop rotation with non-cereal crops helps break the overwintering cycle in crop residue."
    },
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot": {
        "crop": "Corn (Maize)",
        "condition": "Gray Leaf Spot (Cercospora)",
        "scientific_name": "Cercospora zeae-maydis",
        "category": "Fungal",
        "plain_summary": "Gray leaf spot causes distinct narrow, rectangular tan to grey lesions that run parallel along the leaf veins of corn.",
        "visible_symptoms": [
            "Distinct rectangular, blocky tan or grey spots bounded by parallel leaf veins.",
            "Lesions start as small spots with yellow halos and expand into long rectangles (1 to 6 cm).",
            "Severe infection causes lesions to merge, leading to premature leaf blighting and drying."
        ],
        "what_to_check_now": [
            "Inspect lower and middle canopy leaves where humidity stays trapped between rows.",
            "Hold the leaf up against the light to check if lesion borders are strictly parallel to veins.",
            "Check if spots have reached the crucial ear leaf zone."
        ],
        "what_to_monitor": [
            "Monitor during warm (25-30°C), humid weather or periods of morning fog.",
            "Observe whether rectangular spots are spreading upward toward the top canopy."
        ],
        "when_to_seek_help": [
            "If lesions appear at or above the primary ear leaf before grain filling completes.",
            "Consult local agricultural extension (KVK) for regional hybrid tolerance advice."
        ],
        "timeline_actions": [
            {"period": "Today", "task": "Inspect ear leaves on 10 random plants across the field."},
            {"period": "Next 2-3 Days", "task": "Ensure field drainage is clear so humidity does not linger around crop base."},
            {"period": "After 5 Days", "task": "If lesions spread upward rapidly, take a sample leaf to the local extension officer."}
        ],
        "safety_note": "Do not apply chemical sprays without certified agronomist confirmation. Crop rotation helps break spore cycles in crop residue."
    },
    "Corn___healthy": {
        "crop": "Corn (Maize)",
        "condition": "Healthy Crop",
        "scientific_name": "Zea mays",
        "category": "Healthy",
        "plain_summary": "Corn leaves are broad, rich green, and actively photosynthesizing without rust pustules or blight streaks.",
        "visible_symptoms": [
            "Long, clean green leaf blades without powdery pustules or lesions.",
            "Strong stalks and well-developed root anchors."
        ],
        "what_to_check_now": [
            "Ensure balanced fertilization according to crop growth stage (knee-high / tasseling)."
        ],
        "what_to_monitor": [
            "Monitor soil moisture during flowering and grain fill."
        ],
        "when_to_seek_help": [
            "No disease intervention needed."
        ],
        "timeline_actions": [
            {"period": "Today", "task": "Maintain regular field scouting once a week."}
        ],
        "safety_note": "Timely weeding and nitrogen top-dressing support strong plant defense."
    },
    "Pepper__bell___Bacterial_spot": {
        "crop": "Pepper (Capsicum / Bell Pepper)",
        "condition": "Bacterial Spot",
        "scientific_name": "Xanthomonas campestris",
        "category": "Bacterial",
        "plain_summary": "Bacterial spot on pepper causes small water-soaked lesions that turn brown with yellow margins, leading to leaf drop and fruit blisters.",
        "visible_symptoms": [
            "Small, angular, water-soaked dark spots on foliage.",
            "Spots become brown with yellow margins and raised rough surfaces.",
            "Premature dropping of affected leaves.",
            "Raised brown warts or cracks on green peppers."
        ],
        "what_to_check_now": [
            "Check underside of pepper leaves for small raised dark specks.",
            "Avoid overhead sprinkler irrigation which splashes bacteria.",
            "Inspect developing capsicums for surface warts."
        ],
        "what_to_monitor": [
            "Monitor leaf retention — defoliation exposes peppers to sun damage.",
            "Check if symptoms intensify following warm storm rain."
        ],
        "when_to_seek_help": [
            "If young flower buds or small fruits drop excessively."
        ],
        "timeline_actions": [
            {"period": "Today", "task": "Do not work in pepper field while leaves are damp."},
            {"period": "Next 2-3 Days", "task": "Provide root-zone watering only."}
        ],
        "safety_note": "Always sanitize hands and garden tools after handling infected pepper plants."
    },
    "Pepper__bell___healthy": {
        "crop": "Pepper (Capsicum)",
        "condition": "Healthy Crop",
        "scientific_name": "Capsicum annuum",
        "category": "Healthy",
        "plain_summary": "Pepper plants are lush, upright, with glossy green leaves and undamaged flower buds.",
        "visible_symptoms": [
            "Glossy, uniform green foliage.",
            "No necrotic spots, mosaic mottling, or leaf drop."
        ],
        "what_to_check_now": [
            "Maintain moderate soil moisture without water stagnation."
        ],
        "what_to_monitor": [
            "Inspect flower set and fruit development."
        ],
        "when_to_seek_help": ["No action required."],
        "timeline_actions": [
            {"period": "Today", "task": "Inspect underside of leaves weekly for sucking pests (aphids/thrips)."}
        ],
        "safety_note": "Even watering helps prevent blossom end rot in developing peppers."
    },
    "Rice___Blast": {
        "crop": "Rice (Paddy)",
        "condition": "Rice Blast",
        "scientific_name": "Magnaporthe oryzae",
        "category": "Fungal",
        "plain_summary": "Rice blast creates diamond or spindle-shaped lesions with grey centers on paddy leaves and can attack panicle necks.",
        "visible_symptoms": [
            "Spindle-shaped or eye-shaped spots with grey or whitish centers and brown margins on leaves.",
            "Spots enlarge and join together, causing entire leaf blades to wither.",
            "Blackish-brown rot on panicle node (neck blast), causing empty chaffy grains."
        ],
        "what_to_check_now": [
            "Check leaf blades in dense paddy stands for spindle-shaped spots.",
            "Inspect the panicle neck if the crop is in heading stage.",
            "Avoid excessive split application of nitrogen fertilizers."
        ],
        "what_to_monitor": [
            "Monitor during cloudy days with high relative humidity (>90%) and night temperatures around 20°C.",
            "Check whether blast is moving from leaves to the stem nodes."
        ],
        "when_to_seek_help": [
            "If spindle lesions appear across more than 5% of paddy leaf area during tillering.",
            "Immediately if neck blast symptoms appear at panicle emergence."
        ],
        "timeline_actions": [
            {"period": "Today", "task": "Scout paddy field borders and dense canopy spots."},
            {"period": "Next 2-3 Days", "task": "Regulate field water depth according to local recommended agronomy."}
        ],
        "safety_note": "Do not apply excessive nitrogen doses as it produces lush, soft tissue vulnerable to blast infection."
    },
    "Apple___Apple_scab": {
        "crop": "Apple",
        "condition": "Apple Scab",
        "scientific_name": "Venturia inaequalis",
        "category": "Fungal",
        "plain_summary": "Apple scab causes velvety olive-green to dark brown spots on apple leaves and corky scabs on fruit surfaces.",
        "visible_symptoms": [
            "Velvety olive-green to black circular spots on leaves.",
            "Leaves may become distorted, puckered, and drop early.",
            "Brown, corky, scabby spots on fruit skin, often leading to cracking."
        ],
        "what_to_check_now": [
            "Inspect newly emerged leaves on spur shoots.",
            "Check orchard floor for old overwintered leaves which harbor spores.",
            "Inspect young developing fruitlets for velvety dark spots."
        ],
        "what_to_monitor": [
            "Track leaf wetness hours following spring rains.",
            "Monitor fruit enlargement for skin cracking or deformation."
        ],
        "when_to_seek_help": [
            "Consult local horticulture officer for post-infection orchard management."
        ],
        "timeline_actions": [
            {"period": "Today", "task": "Rake and clear fallen leaves from under apple tree canopies."},
            {"period": "Next 2-3 Days", "task": "Prune dense canopy branches during dormancy to improve sunlight penetration."}
        ],
        "safety_note": "Orchard hygiene and canopy aeration significantly reduce scab pressure."
    },
    "Apple___healthy": {
        "crop": "Apple",
        "condition": "Healthy Foliage",
        "scientific_name": "Malus domestica",
        "category": "Healthy",
        "plain_summary": "Apple foliage is vibrant, well-expanded, and free of scab lesions or rust spots.",
        "visible_symptoms": [
            "Clean, oval green leaves with intact margins.",
            "No dark velvety spots or yellow cedar rust lesions."
        ],
        "what_to_check_now": ["Maintain routine orchard canopy inspection."],
        "what_to_monitor": ["Inspect leaves following rainy periods."],
        "when_to_seek_help": ["No disease intervention needed."],
        "timeline_actions": [
            {"period": "Today", "task": "Maintain regular orchard tree care and pruning schedules."}
        ],
        "safety_note": "Good orchard floor sanitation helps keep trees healthy."
    },
    "Grape___Black_rot": {
        "crop": "Grape",
        "condition": "Black Rot",
        "scientific_name": "Guignardia bidwellii",
        "category": "Fungal",
        "plain_summary": "Black rot produces small circular reddish-brown leaf spots with dark borders, and shrivels grape berries into hard black mummies.",
        "visible_symptoms": [
            "Small circular reddish-brown spots on leaves surrounded by dark borders.",
            "Tiny black pimple-like dots (pycnidia) arranged in a ring inside leaf spots.",
            "Berries turn brown, rot, and shrivel into hard, black, wrinkled mummies."
        ],
        "what_to_check_now": [
            "Inspect vine leaves for circular tan/reddish spots with tiny black dots.",
            "Check grape bunches for shriveled dark berries.",
            "Remove and destroy any dried mummified berries from vines."
        ],
        "what_to_monitor": [
            "Monitor fruit bunches from bloom through veraison (ripening).",
            "Observe vines during warm, humid, wet spells."
        ],
        "when_to_seek_help": [
            "If black rot symptoms appear on fruit clusters before bunch closure."
        ],
        "timeline_actions": [
            {"period": "Today", "task": "Remove and safely discard any dried black berry mummies from the vine."},
            {"period": "Next 2-3 Days", "task": "Tuck or trim shoots to maintain an open canopy for rapid drying after rain."}
        ],
        "safety_note": "Removing overwintering mummies removes the primary spore source for next season."
    },
    "Grape___healthy": {
        "crop": "Grape",
        "condition": "Healthy Vine",
        "scientific_name": "Vitis vinifera",
        "category": "Healthy",
        "plain_summary": "Vigorous green grape leaves with clean foliage and healthy developing bunches.",
        "visible_symptoms": ["Lush green leaves, strong cane growth, smooth berries."],
        "what_to_check_now": ["Maintain trellis canopy management."],
        "what_to_monitor": ["Monitor cluster ventilation and canopy airflow."],
        "when_to_seek_help": ["No disease intervention needed."],
        "timeline_actions": [{"period": "Today", "task": "Ensure adequate trellis tying and weed management."}],
        "safety_note": "Open trellising allows breeze and sunlight to keep grape clusters naturally resilient."
    },
    "Uncertain___Low_Confidence": {
        "crop": "General Crop / Uncertain",
        "condition": "Inconclusive or Uncertain Observation",
        "scientific_name": "Unspecified",
        "category": "Uncertain",
        "plain_summary": "The photo does not clearly show characteristic symptoms, or lighting/focus makes reliable identification difficult. Avani avoids guessing uncertain conditions.",
        "visible_symptoms": [
            "Image may be slightly blurred, taken under harsh glare, or the affected area is partially obscured.",
            "Symptoms may be in early stages or non-specific."
        ],
        "what_to_check_now": [
            "Take a fresh photograph of a single leaf in gentle, indirect daylight.",
            "Ensure the leaf is in sharp focus against a clear, plain background.",
            "Inspect both the upper side and underside of the leaf with a magnifying glass if available.",
            "Note whether symptoms are restricted to 1-2 leaves or widespread."
        ],
        "what_to_monitor": [
            "Observe whether discoloration or spots change shape or size over the next 48 hours.",
            "Check whether healthy new shoots are emerging from the top."
        ],
        "when_to_seek_help": [
            "If symptoms are worsening or spreading to multiple plants in the plot.",
            "Take fresh affected leaves in a ventilated paper bag to your nearest agricultural officer or KVK for laboratory examination."
        ],
        "timeline_actions": [
            {"period": "Today", "task": "Retake a clear, well-lit close-up photograph of the affected leaf."},
            {"period": "Today", "task": "Check soil moisture and root zone for waterlogging or dryness."},
            {"period": "Next 2-3 Days", "task": "Observe if symptoms expand or if new clean leaves emerge."},
            {"period": "After 5 Days", "task": "If uncertainty remains and crop looks distressed, contact local agricultural extension."}
        ],
        "safety_note": "Never spray chemicals on an unverified condition. Accurate visual inspection or expert consultation protects your crop and soil."
    },
    
    'Apple___Black_rot': {'crop': 'Apple', 'condition': 'Black Rot (Frog-Eye Leaf Spot)', 'scientific_name': 'Botryosphaeria obtusa', 'category': 'Fungal', 'plain_summary': 'Black rot produces circular purple-bordered leaf spots (frog-eye spots) and dark rotting mummified fruit.', 'visible_symptoms': ['Small purple spots on leaves expanding with light brown centers and purple margins.', 'Rotting fruit with concentric brown and black rings.', 'Sunken dark cankers on branches and twigs.'], 'what_to_check_now': ['Inspect woody branches for dark sunken cankers harboring the fungus.', 'Remove any mummified fruit hanging on branches or fallen beneath the canopy.'], 'what_to_monitor': ['Monitor during warm, rainy periods (20-28°C).', 'Check if leaf spots coalesce into larger necrotic patches.'], 'when_to_seek_help': ['If branch cankers begin girdling scaffold limbs.'], 'timeline_actions': [{'period': 'Today', 'task': 'Prune out dead wood and cankers during dry weather; collect and dispose of pruned wood.'}, {'period': 'Next 2-3 Days', 'task': 'Sanitize pruning shears with 70% alcohol between cuts.'}], 'safety_note': 'Orchard sanitation and removing dead wood are the most effective non-chemical defenses.'},
    'Apple___Cedar_apple_rust': {'crop': 'Apple', 'condition': 'Cedar Apple Rust', 'scientific_name': 'Gymnosporangium juniperi-virginianae', 'category': 'Fungal', 'plain_summary': 'Produces bright yellow-orange circular spots on the upper leaf surface that develop tiny tube-like structures on the underside.', 'visible_symptoms': ['Bright orange or yellow spots on upper apple leaves.', 'Raised orange spots on fruit surfaces.', 'Spore-producing fungal cups on leaf undersides in late summer.'], 'what_to_check_now': ['Inspect nearby cedar or juniper trees within 500m for gall formations.', 'Check both upper and lower leaf surfaces for yellow-orange halos.'], 'what_to_monitor': ['Monitor in spring during wet weather when cedar galls release spores.'], 'when_to_seek_help': ['If severe premature leaf drop occurs across multiple trees.'], 'timeline_actions': [{'period': 'Today', 'task': 'Scout surrounding boundary area for alternate juniper/cedar host trees.'}, {'period': 'Next 2-3 Days', 'task': 'Ensure good canopy pruning to promote rapid leaf drying.'}], 'safety_note': 'Cedar apple rust requires both apple and juniper hosts to complete its life cycle.'},
    'Blueberry___healthy': {'crop': 'Blueberry', 'condition': 'Healthy Foliage', 'scientific_name': 'Vaccinium corymbosum', 'category': 'Healthy', 'plain_summary': 'Blueberry foliage is vibrant, green, and free from anthracnose spots or stem blight.', 'visible_symptoms': ['Glossy, uniform green oval leaves.', 'Clean reddish-brown canes without lesions.'], 'what_to_check_now': ['Maintain acidic soil pH (4.5 to 5.2) and organic pine bark mulch.', 'Inspect root zone for adequate drip moisture.'], 'what_to_monitor': ['Monitor soil moisture during berry swelling.'], 'when_to_seek_help': ['No disease intervention needed.'], 'timeline_actions': [{'period': 'Today', 'task': 'Check soil moisture under mulch layer.'}], 'safety_note': 'Organic mulching conserves moisture and protects shallow blueberry feeder roots.'},
    'Cherry_(including_sour)___Powdery_mildew': {'crop': 'Cherry', 'condition': 'Powdery Mildew', 'scientific_name': 'Podosphaera clandestina', 'category': 'Fungal', 'plain_summary': 'Powdery mildew forms patches of white, powdery fungal coating on leaves and young shoots, causing leaf curling.', 'visible_symptoms': ['White, talcum powder-like fungal growth on leaves and green shoots.', 'Distorted, upward-curling young leaves.', 'Stunted terminal shoot growth.'], 'what_to_check_now': ['Inspect young, tender leaves on inside canopy water sprouts.', 'Check developing fruit clusters for surface fungal webbing.'], 'what_to_monitor': ['Monitor in warm, dry weather with high relative humidity at night.'], 'when_to_seek_help': ['If powdery coating covers more than 20% of fruit spurs.'], 'timeline_actions': [{'period': 'Today', 'task': 'Prune out interior water sprouts to improve sunlight and air penetration.'}, {'period': 'Next 2-3 Days', 'task': 'Avoid excess nitrogen fertilization that promotes lush vulnerable foliage.'}], 'safety_note': 'Proper canopy thinning reduces the trapped humidity that fuels powdery mildew.'},
    'Cherry_(including_sour)___healthy': {'crop': 'Cherry', 'condition': 'Healthy Foliage', 'scientific_name': 'Prunus avium', 'category': 'Healthy', 'plain_summary': 'Cherry tree leaves are smooth, rich green, and actively growing without shot-hole or mildew.', 'visible_symptoms': ['Smooth, deep green leaves with serrated margins.', 'Healthy fruit spurs and clean bark.'], 'what_to_check_now': ['Maintain regular orchard scouting once weekly.'], 'what_to_monitor': ['Monitor irrigation during fruit enlargement.'], 'when_to_seek_help': ['No disease intervention required.'], 'timeline_actions': [{'period': 'Today', 'task': 'Scout canopy for bird netting needs.'}], 'safety_note': 'Routine pruning in dormant season ensures vigorous spring canopy.'},
    'Grape___Esca_(Black_Measles)': {'crop': 'Grape', 'condition': 'Esca (Black Measles / Trunk Disease)', 'scientific_name': 'Phaeomoniella chlamydospora & complex', 'category': 'Fungal', 'plain_summary': 'Esca causes tiger-stripe leaf discoloration with yellow/brown necrosis between veins and spotted fruit berries.', 'visible_symptoms': ['Interveinal yellow and reddish-brown tiger-striping on leaves.', 'Dark purple or black speckling (measles) on ripening grape berries.', 'Sudden vine wilting (apoplexy) during hot summer spells.'], 'what_to_check_now': ['Inspect vine trunks for spongy wood rot or dead cordons.', 'Check berry clusters for dark sunken measles spots.'], 'what_to_monitor': ['Monitor vines during prolonged hot, dry spells following spring rain.'], 'when_to_seek_help': ['If main trunk wood shows extensive internal decay or cordons die back.'], 'timeline_actions': [{'period': 'Today', 'task': 'Mark affected vines with ribbon for remedial pruning in late winter.'}, {'period': 'Next 2-3 Days', 'task': 'Prune symptomatic cordons back to clean, white, healthy wood.'}], 'safety_note': 'Seal large pruning wounds with certified wound protectant to prevent trunk fungal entry.'},
    'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)': {'crop': 'Grape', 'condition': 'Leaf Blight (Isariopsis)', 'scientific_name': 'Pseudocercospora cladosporioides', 'category': 'Fungal', 'plain_summary': 'Causes irregular, dark brown spots on grape leaves that coalesce into large blighted areas in late season.', 'visible_symptoms': ['Angular to irregular dark brown spots on upper leaf surfaces.', 'Olive-brown fuzzy fungal sporulation on spot undersides.', 'Premature leaf drop in late summer before harvest.'], 'what_to_check_now': ['Inspect lower canopy leaves where airflow is restricted.', 'Check if leaf drop is exposing bunches to direct sun scald.'], 'what_to_monitor': ['Monitor during warm, rainy periods in mid-to-late summer.'], 'when_to_seek_help': ['If severe defoliation threatens fruit ripening.'], 'timeline_actions': [{'period': 'Today', 'task': 'Remove weeds around vine base and ensure canopy trellis is well-ventilated.'}], 'safety_note': 'Proper canopy leaf plucking around the fruit zone improves drying speed.'},
    'Orange___Haunglongbing_(Citrus_greening)': {'crop': 'Orange (Citrus)', 'condition': 'Citrus Greening (Huanglongbing / HLB)', 'scientific_name': 'Candidatus Liberibacter asiaticus', 'category': 'Bacterial', 'plain_summary': 'Citrus greening causes asymmetric blotchy yellowing on leaves, yellow shoots, and small, lopsided, bitter fruit.', 'visible_symptoms': ['Asymmetric blotchy yellow mottle on leaf blades across veins.', 'Yellowing of individual shoots or branches while rest of tree is green.', 'Small, lopsided fruit that stays green at the bottom with bitter taste.', 'Stunted root system and twig dieback.'], 'what_to_check_now': ['Inspect young flushes for the presence of Asian Citrus Psyllid vectors (insects feeding at 45-degree angle).', 'Check if leaf yellowing is non-symmetrical (compare left and right sides of the main leaf vein).'], 'what_to_monitor': ['Monitor new vegetative flush cycles for psyllid nymphs and waxy secretions.'], 'when_to_seek_help': ['Critical: Notify your district agricultural officer immediately. HLB is a regulated disease that spreads rapidly via insect vectors.'], 'timeline_actions': [{'period': 'Today', 'task': 'Scout orchard trees row by row; inspect tender young shoot flushes with a hand lens.'}, {'period': 'Next 2-3 Days', 'task': 'Contact agricultural extension for vector monitoring and certified planting material advice.'}], 'safety_note': 'Plant only certified disease-free nursery stock. Control the psyllid vector to prevent orchard-wide transmission.'},
    'Peach___Bacterial_spot': {'crop': 'Peach', 'condition': 'Bacterial Spot', 'scientific_name': 'Xanthomonas arboricola pv. pruni', 'category': 'Bacterial', 'plain_summary': 'Bacterial spot produces small angular purple-brown spots that drop out leaving a shot-hole appearance on peach leaves and pitted fruit.', 'visible_symptoms': ['Angular, purple-brown water-soaked spots on leaves that drop out (shot-hole).', 'Cracking, gumming, and dark pitting on peach fruit surfaces.', 'Tip dieback on young green twigs.'], 'what_to_check_now': ['Inspect leaf tips and margins where wind-driven rain deposits bacteria.', 'Check fruit surfaces for gumming craters.'], 'what_to_monitor': ['Monitor in warm, humid weather with frequent wind-blown rains.'], 'when_to_seek_help': ['If fruit cracking becomes widespread across the orchard.'], 'timeline_actions': [{'period': 'Today', 'task': 'Avoid working in orchard while trees are wet from rain or morning dew.'}, {'period': 'Next 2-3 Days', 'task': 'Maintain moderate tree vigor; avoid excessive nitrogen.'}], 'safety_note': 'Bacterial diseases enter through natural leaf pores and wind wounds.'},
    'Peach___healthy': {'crop': 'Peach', 'condition': 'Healthy Foliage', 'scientific_name': 'Prunus persica', 'category': 'Healthy', 'plain_summary': 'Peach foliage is long, lance-shaped, deep green, and free from shot-hole lesions or curl.', 'visible_symptoms': ['Glossy, lanceolate green leaves with no lesions or puckering.', 'Firm, clean fruit development.'], 'what_to_check_now': ['Maintain routine irrigation and tree pruning.'], 'what_to_monitor': ['Monitor fruit load and thin overloaded branches.'], 'when_to_seek_help': ['No disease intervention required.'], 'timeline_actions': [{'period': 'Today', 'task': 'Check soil moisture in drip line.'}], 'safety_note': 'Balanced pruning maintains open vase structure for maximum sunlight.'},
    'Raspberry___healthy': {'crop': 'Raspberry', 'condition': 'Healthy Foliage', 'scientific_name': 'Rubus idaeus', 'category': 'Healthy', 'plain_summary': 'Raspberry canes and compound leaves are vigorous, rich green, and free from cane blight or rust.', 'visible_symptoms': ['Compound serrated green leaves with pale undersides.', 'Clean primocanes without lesions.'], 'what_to_check_now': ['Ensure trellis wires support canes upright off the ground.'], 'what_to_monitor': ['Monitor irrigation during flowering and fruiting.'], 'when_to_seek_help': ['No intervention required.'], 'timeline_actions': [{'period': 'Today', 'task': 'Prune spent floricanes post-harvest.'}], 'safety_note': 'Removing old canes improves airflow for newly growing canes.'},
    'Soybean___healthy': {'crop': 'Soybean', 'condition': 'Healthy Foliage', 'scientific_name': 'Glycine max', 'category': 'Healthy', 'plain_summary': 'Soybean trifoliate leaves are broad, uniform green, and actively fixing nitrogen.', 'visible_symptoms': ['Trifoliate clean green leaves with fine hair texture.', 'Even canopy closure without chlorosis.'], 'what_to_check_now': ['Scout field for pod borer or defoliator pests.'], 'what_to_monitor': ['Monitor soil moisture during flowering (R1) and pod fill (R3-R5).'], 'when_to_seek_help': ['No disease intervention needed.'], 'timeline_actions': [{'period': 'Today', 'task': 'Maintain regular weekly field scouting.'}], 'safety_note': 'Healthy soybean stands tolerate minor early leaf feeding without yield loss.'},
    'Squash___Powdery_mildew': {'crop': 'Squash', 'condition': 'Powdery Mildew', 'scientific_name': 'Podosphaera xanthii', 'category': 'Fungal', 'plain_summary': 'Causes talcum-like white powdery fungal spots on squash leaves and stems, leading to yellowing and premature leaf death.', 'visible_symptoms': ['Circular powdery white spots on upper and lower leaf surfaces.', 'Older leaves become covered with white mold, turn yellow, and dry up.', 'Sunscald on exposed squash fruits due to canopy defoliation.'], 'what_to_check_now': ['Inspect older, shaded leaves deep in the squash canopy.', 'Check leaf petioles and undersides for early white dusting.'], 'what_to_monitor': ['Monitor in warm, dry climates with high canopy humidity.'], 'when_to_seek_help': ['If powdery coating spreads to more than 30% of foliage before harvest.'], 'timeline_actions': [{'period': 'Today', 'task': 'Ensure wide plant spacing and drip irrigation (avoid overhead watering).'}, {'period': 'Next 2-3 Days', 'task': 'Prune out completely dried, dead lower leaves.'}], 'safety_note': 'Drip irrigation keeps squash leaves dry and reduces fungal sporulation.'},
    'Strawberry___Leaf_scorch': {'crop': 'Strawberry', 'condition': 'Leaf Scorch', 'scientific_name': 'Diplocarpon earlianum', 'category': 'Fungal', 'plain_summary': 'Leaf scorch produces numerous small, irregular dark purple blotches that expand and cause leaves to look burned or scorched.', 'visible_symptoms': ['Irregular purplish spots without pale centers on upper leaf surfaces.', 'Spots coalesce, causing leaf margins to curl upward and turn brown and dry (scorched).', 'Petiole and runner infection can girdle strawberry plant runners.'], 'what_to_check_now': ['Inspect middle and older leaves for purple blotches.', 'Check strawberry runners and fruit caps (calyx) for purple lesions.'], 'what_to_monitor': ['Monitor in warm, wet weather with frequent sprinkler irrigation or rain.'], 'when_to_seek_help': ['If whole strawberry beds show severe leaf browning before berry harvest.'], 'timeline_actions': [{'period': 'Today', 'task': 'Remove older infected leaves during runner grooming.'}, {'period': 'Next 2-3 Days', 'task': 'Switch to drip irrigation to keep strawberry foliage dry.'}], 'safety_note': 'Plant on raised plastic-mulched beds to reduce soil splash onto leaves.'},
    'Strawberry___healthy': {'crop': 'Strawberry', 'condition': 'Healthy Foliage', 'scientific_name': 'Fragaria x ananassa', 'category': 'Healthy', 'plain_summary': 'Strawberry crowns and trifoliate leaves are dark green, compact, and free from spots or crown rot.', 'visible_symptoms': ['Trifoliate glossy green leaves with serrated edges.', 'Healthy white roots and vigorous crown growth.'], 'what_to_check_now': ['Check soil moisture under mulch and maintain weed-free beds.'], 'what_to_monitor': ['Monitor irrigation during bloom and fruit ripening.'], 'when_to_seek_help': ['No disease intervention needed.'], 'timeline_actions': [{'period': 'Today', 'task': 'Keep straw or plastic mulch clean around fruit.'}], 'safety_note': 'Straw mulching protects developing berries from touching damp soil.'},
    'Tomato___Leaf_Mold': {'crop': 'Tomato', 'condition': 'Leaf Mold', 'scientific_name': 'Passalora fulva', 'category': 'Fungal', 'plain_summary': 'Leaf mold produces pale green-to-yellow spots on upper leaf surfaces and velvety olive-green to brown mold on the underside.', 'visible_symptoms': ['Diffuse pale yellow spots on the upper leaf surface.', 'Dense, velvety olive-green or grayish-brown mold on the leaf underside directly below spots.', 'Infected leaves curl, wither, and drop prematurely.'], 'what_to_check_now': ['Turn yellowing leaves over to check for olive-green velvety fuzz.', 'Inspect greenhouse or high-tunnel tomatoes where humidity exceeds 85%.'], 'what_to_monitor': ['Monitor humidity levels inside canopy; leaf mold thrives in humid, stagnant air.'], 'when_to_seek_help': ['If mold causes rapid defoliation in enclosed growing structures.'], 'timeline_actions': [{'period': 'Today', 'task': 'Prune lower tomato suckers and leaves to increase ventilation.'}, {'period': 'Next 2-3 Days', 'task': 'Open greenhouse side curtains to vent humid air.'}], 'safety_note': 'Maximizing air movement and keeping relative humidity below 85% prevents leaf mold.'},
    'Tomato___Spider_mites Two-spotted_spider_mite': {'crop': 'Tomato', 'condition': 'Two-Spotted Spider Mites', 'scientific_name': 'Tetranychus urticae', 'category': 'Pest / Mite', 'plain_summary': 'Spider mites cause tiny yellow/white speckling (stippling) on leaves, accompanied by fine silky webbing on leaf undersides.', 'visible_symptoms': ['Fine white or yellow speckling/stippling on upper leaf surfaces.', 'Fine silky webbing under leaves and between plant stems.', 'Leaves turn bronze or yellow, dry up, and drop.', 'Tiny red or amber mites visible moving under hand lens.'], 'what_to_check_now': ['Tap an affected leaf over a white sheet of paper to see tiny moving mites.', 'Inspect leaf undersides with a 10x hand lens for mites and round eggs.', 'Check hot, dusty field edges where mites colonize first.'], 'what_to_monitor': ['Monitor during hot (over 30°C), dry, dusty weather.'], 'when_to_seek_help': ['If webbing covers terminal shoots and top flower clusters.'], 'timeline_actions': [{'period': 'Today', 'task': 'Hose down dusty field borders to reduce mite migration.'}, {'period': 'Next 2-3 Days', 'task': 'Apply biological neem oil or insecticidal soap to leaf undersides during cool evening hours.'}], 'safety_note': 'Avoid broad-spectrum synthetic pyrethroids which kill beneficial predatory mites and cause spider mite flare-ups.'},
    'Tomato___Target_Spot': {'crop': 'Tomato', 'condition': 'Target Spot', 'scientific_name': 'Corynespora cassiicola', 'category': 'Fungal', 'plain_summary': 'Target spot produces circular brown lesions with subtle concentric rings and light brown centers on tomato leaves and fruit.', 'visible_symptoms': ['Small water-soaked specks expanding into circular lesions with concentric rings.', 'Lesions have dark brown margins with lighter centers.', 'Severely affected leaves turn yellow and drop.', 'Sunken brown circular lesions on tomato fruit.'], 'what_to_check_now': ['Inspect lower and middle canopy leaves for target-like spots.', 'Check if spots are larger than bacterial specks.'], 'what_to_monitor': ['Monitor during periods of warm (20-28°C), humid weather and long dew periods.'], 'when_to_seek_help': ['If target spot defoliation exposes green fruit to sunburn.'], 'timeline_actions': [{'period': 'Today', 'task': 'Stake tomatoes and prune lower leaves touching the soil.'}, {'period': 'Next 2-3 Days', 'task': 'Ensure drip irrigation is used to keep foliage dry.'}], 'safety_note': 'Crop rotation with non-solanaceous crops reduces soil-borne inoculum.'},
    'Tomato___Tomato_mosaic_virus': {'crop': 'Tomato', 'condition': 'Tomato Mosaic Virus (ToMV)', 'scientific_name': 'Tomato mosaic virus', 'category': 'Viral', 'plain_summary': 'Tomato mosaic virus causes mottled light-and-dark green pattern on leaves, leaf distortion (shoestringing), and stunted growth.', 'visible_symptoms': ['Mottled light and dark green mosaic patterns on leaves.', 'Distorted, blistered, or narrow strap-like leaves (shoestring).', 'Stunted plant growth and reduced fruit set.', 'Uneven ripening with internal brown browning in fruit.'], 'what_to_check_now': ['Check if top leaves show light green mosaic patterns.', 'Inspect for deformed strap-like leaflets.'], 'what_to_monitor': ['Monitor whether new shoots continue to emerge mottled and stunted.'], 'when_to_seek_help': ['If viral symptoms appear across multiple tomato plants.'], 'timeline_actions': [{'period': 'Today', 'task': 'Do not touch healthy plants after handling symptomatic plants.'}, {'period': 'Today', 'task': 'Wash hands and tools thoroughly with soap and water (or 20% non-fat dry milk solution).'}, {'period': 'Next 2-3 Days', 'task': 'Remove and destroy severely stunted infected plants to prevent manual spread.'}], 'safety_note': 'ToMV is easily transmitted mechanically on hands, tools, and clothing. Strict sanitation is paramount.'},
"Invalid___Non_Leaf": {
        "crop": "Non-Crop / Invalid Subject",
        "condition": "No Leaf or Plant Detected",
        "scientific_name": "N/A",
        "category": "Invalid",
        "plain_summary": "The uploaded photograph does not appear to contain a recognizable plant leaf. Please capture a clear photo of an actual crop leaf.",
        "visible_symptoms": [
            "Image contains background objects, text, people, or non-vegetation surfaces."
        ],
        "what_to_check_now": [
            "Place a single crop leaf on a neutral surface or hold it steady against a plain background.",
            "Ensure the camera lens is clean and focused directly on the leaf."
        ],
        "what_to_monitor": [
            "Retake the scan with a leaf showing clear symptoms."
        ],
        "when_to_seek_help": [
            "Upload an authentic leaf photograph to proceed."
        ],
        "timeline_actions": [
            {"period": "Today", "task": "Capture a fresh photograph focusing strictly on a plant leaf."}
        ],
        "safety_note": "Avani requires an authentic leaf photo to provide reliable inspection guidance."
    }
}

# Fallback generic crop reference when model matches an uncommon class

# Exact PlantVillage class name aliases
GUIDANCE_DATABASE["Corn_(maize)___Common_rust_"] = GUIDANCE_DATABASE["Corn___Common_rust"]
GUIDANCE_DATABASE["Corn_(maize)___Northern_Leaf_Blight"] = GUIDANCE_DATABASE["Corn___Northern_Leaf_Blight"]
GUIDANCE_DATABASE["Corn_(maize)___healthy"] = GUIDANCE_DATABASE["Corn___healthy"]
GUIDANCE_DATABASE["Pepper,_bell___Bacterial_spot"] = GUIDANCE_DATABASE["Pepper__bell___Bacterial_spot"]
GUIDANCE_DATABASE["Pepper,_bell___healthy"] = GUIDANCE_DATABASE["Pepper__bell___healthy"]
GUIDANCE_DATABASE["Tomato___Tomato_Yellow_Leaf_Curl_Virus"] = GUIDANCE_DATABASE["Tomato___Yellow_Leaf_Curl_Virus"]

GENERIC_CROP_GUIDANCE = {
    "crop": "General Crop",
    "condition": "Foliage Inspection",
    "scientific_name": "Plantae",
    "category": "General",
    "plain_summary": "Preliminary foliage observation detected. Follow standard field scouting practices.",
    "visible_symptoms": [
        "Color variation or markings on the leaf surface."
    ],
    "what_to_check_now": [
        "Inspect leaf undersides and stem junctions for pests or fungal powder.",
        "Check soil moisture around the root zone.",
        "Compare affected plant with healthy neighboring plants in the same field."
    ],
    "what_to_monitor": [
        "Monitor whether symptoms expand over the next 3 to 4 days.",
        "Keep track of recent rainfall or irrigation patterns."
    ],
    "when_to_seek_help": [
        "If more than 10% of your crop shows similar symptoms.",
        "Consult your local agricultural extension service for regional advice."
    ],
    "timeline_actions": [
        {"period": "Today", "task": "Inspect 5-10 plants across the plot to determine spread extent."},
        {"period": "Next 2-3 Days", "task": "Check soil moisture and ensure no standing water around roots."},
        {"period": "After 5 Days", "task": "Consult local extension officer if condition progresses."}
    ],
    "safety_note": "Follow standard agricultural hygiene and consult certified local agronomists before applying any crop protection products."
}
