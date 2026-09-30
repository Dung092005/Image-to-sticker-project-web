-- Replace cartoon/vector card prompts with photorealistic theme briefs.
-- Style is enforced by scripts/generate_image.py build_prompt(); cards only supply theme + captions.

UPDATE sticker_cards
SET prompt = $prompt$Based on the uploaded reference photo, keep the exact same real face and identity in every sticker. Create one cute photorealistic sticker sheet with 16 diverse everyday expressions on a clean pure white background. Even 4-column by 4-row grid, identical sizes, consistent margins, no overlaps. Natural skin texture, soft flattering light, sharp eyes and hair — look like a real beautiful person, not cartoon or vector. Add one short cute Vietnamese caption with correct diacritics on each sticker. Moments: cheerful hello, laughing, thank you, sorry, wait for me, thinking, wow, disbelief, love, miss you, exhausted, a bit sad, celebrating, hungry, good night, good luck. Captions: “Xin chào!”, “Haha!”, “Cảm ơn nha!”, “Xin lỗi nhé!”, “Đợi mình với!”, “Đang suy nghĩ...”, “Wow!”, “Không thể tin được!”, “Yêu bạn!”, “Nhớ bạn!”, “Mệt quá!”, “Buồn một chút...”, “Vui quá!”, “Đói rồi!”, “Ngủ ngon nhé!”, “Chúc may mắn!”.$prompt$,
    updated_at = NOW()
WHERE id = 'everyday-expressions';

UPDATE sticker_cards
SET prompt = $prompt$Based on the uploaded reference photo, keep the exact same real face and identity in every sticker. Create one cute photorealistic summer sticker sheet with 16 beach/summer moments on a clean pure white background. Even 4x4 grid, identical sticker sizes, no overlaps. Photorealistic beautiful person, natural skin, soft light — not cartoon/vector. Short cute Vietnamese captions with diacritics. Moments: morning greeting, bright smile, feeling hot, invite to beach, cool breeze, coconut drink, surfing, laughing, hungry, nap, celebrate, relax, take photo, shield from sun, thumbs up, goodbye. Captions: “Chào buổi sáng!”, “Vui quá!”, “Nóng quá!”, “Đi biển thôi!”, “Mát ghê!”, “Uống nước dừa nào!”, “Sóng ơi chờ nhé!”, “Cười lên nào!”, “Đói bụng rồi!”, “Ngủ trưa thôi!”, “Yay!”, “Thư giãn nào!”, “Chụp tấm hình nhé!”, “Ôi nắng quá!”, “Mình ổn!”, “Hẹn gặp lại!”.$prompt$,
    updated_at = NOW()
WHERE id = 'summer-sticker-pack';

UPDATE sticker_cards
SET prompt = $prompt$Based on the uploaded reference photo, keep the exact same real face and identity in every sticker. Create one cute photorealistic emotion sticker sheet with 16 expressive reactions on a clean pure white background. Even 4x4 grid. Photorealistic, natural skin, beautiful flattering look — not cartoon/vector. Short cute Vietnamese captions. Emotions: happy, laughing, crying, surprised, confused, thinking, shy, proud, excited, worried, angry, sleepy, tired, hungry, in love, thankful. Captions: “Vui quá!”, “Haha!”, “Huhu...”, “Ôi trời!”, “Ủa gì vậy?”, “Để mình nghĩ...”, “Ngại quá!”, “Tự hào ghê!”, “Yay!”, “Lo quá...”, “Bực mình rồi!”, “Buồn ngủ quá!”, “Mệt xỉu!”, “Đói rồi!”, “Yêu quá!”, “Cảm ơn nha!”.$prompt$,
    updated_at = NOW()
WHERE id = 'cute-emotions';

UPDATE sticker_cards
SET prompt = $prompt$Based on the uploaded reference photo, keep the exact same real face and identity in every sticker. Create one cute photorealistic work/study sticker sheet with 16 school-and-office moments on a clean pure white background. Even 4x4 grid. Photorealistic beautiful person, natural skin — not cartoon/vector. Short cute Vietnamese captions. Moments: start work, study, take notes, focus, meeting, present, ask question, understand, confused, need help, coffee, overtime, deadline, finished, break, sleepy, celebrate, encourage, thank teammate, goodbye. Captions: “Bắt đầu thôi!”, “Học bài nào!”, “Đang ghi chép...”, “Tập trung nào!”, “Họp thôi!”, “Để mình trình bày!”, “Cho mình hỏi chút!”, “À, hiểu rồi!”, “Mình chưa hiểu...”, “Cứu mình với!”, “Cà phê không?”, “Làm thêm chút nữa...”, “Sắp deadline rồi!”, “Xong rồi nè!”, “Nghỉ giải lao thôi!”, “Buồn ngủ quá!”.$prompt$,
    updated_at = NOW()
WHERE id = 'work-study-vibes';

UPDATE sticker_cards
SET prompt = $prompt$Based on the uploaded reference photo, keep the exact same real face and identity in every sticker. Create one cute photorealistic romance sticker sheet with 16 affectionate moments on a clean pure white background. Even 4x4 grid. Photorealistic, natural beautiful skin and soft light — not cartoon/vector. Short cute Vietnamese captions. Moments: hello love, send heart, shy smile, blush, miss you, ask date, give flowers, give gift, blow kiss, hug, I love you, thank love, sweet apology, playful jealous, cheer up, good night, good morning, reply please, waiting, goodbye love. Captions: “Chào người thương!”, “Thả tim nè!”, “Cười với mình nhé!”, “Ngại quá đi!”, “Nhớ bạn quá!”, “Hẹn hò nhé?”, “Tặng hoa nè!”, “Quà cho bạn đây!”, “Chụt một cái!”, “Ôm cái nào!”, “Yêu bạn nhất!”, “Cảm ơn tình yêu!”, “Đừng giận nha!”, “Ghen một chút thôi!”, “Đừng buồn nhé!”, “Ngủ ngon nha!”.$prompt$,
    updated_at = NOW()
WHERE id = 'love-notes';

UPDATE sticker_cards
SET prompt = $prompt$Based on the uploaded reference photo, keep the exact same real face and identity in every sticker. Create one cute photorealistic foodie sticker sheet with 16 eating moments on a clean pure white background. Even 4x4 grid. Photorealistic beautiful person, natural skin — not cartoon/vector. Short cute Vietnamese captions. Moments: hungry, choose food, order, wait, smell food, first bite, eat happily, love spicy, too full, more please, share food, offer bite, milk tea, dessert, cook, delicious, too spicy, pay bill, thank for meal, bye after meal. Captions: “Đói bụng rồi!”, “Ăn gì đây?”, “Cho mình gọi món!”, “Đợi đồ ăn nhé!”, “Thơm quá đi!”, “Miếng đầu tiên!”, “Ngon tuyệt vời!”, “Cay nhưng ngon!”, “No căng bụng!”, “Cho thêm phần nữa!”, “Ăn chung nhé!”, “Bạn ăn miếng không?”, “Trà sữa không?”, “Tráng miệng thôi!”, “Để mình nấu!”, “Ngon xỉu luôn!”.$prompt$,
    updated_at = NOW()
WHERE id = 'foodie-moments';

UPDATE sticker_cards
SET prompt = $prompt$Based on the uploaded reference photo, keep the exact same real face and identity in every sticker. Create one cute photorealistic travel sticker sheet with 16 adventure moments on a clean pure white background. Even 4x4 grid. Photorealistic beautiful person, natural skin and soft light — not cartoon/vector. Short cute Vietnamese captions. Moments: pack luggage, check map, leave home, airport wait, train, arrive, take photos, check-in, admire view, walk nature, get lost, ask directions, local food, souvenirs, tired, amazed, sunset, promise next trip, goodbye place, want to travel again. Captions: “Xếp đồ thôi!”, “Bản đồ đâu rồi?”, “Lên đường nhé!”, “Chờ chuyến bay thôi!”, “Tàu chạy rồi!”, “Đến nơi rồi!”, “Chụp ảnh nào!”, “Check-in nhé!”, “Đẹp quá đi!”, “Đi dạo thôi!”, “Hình như lạc rồi...”, “Bạn ơi, đường nào?”, “Đặc sản ngon quá!”, “Mua quà nhé!”, “Mỏi chân quá!”, “Choáng ngợp luôn!”.$prompt$,
    updated_at = NOW()
WHERE id = 'travel-adventures';
