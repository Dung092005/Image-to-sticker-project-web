-- Make default card briefs prefer beautiful photorealistic stickers,
-- while allowing user custom prompt to switch style (e.g. 3D chibi).

UPDATE sticker_cards
SET prompt = $prompt$Based on the uploaded reference photo, keep the exact same face identity in every sticker.
Default art style: photorealistic, beautiful real person, natural skin texture, soft studio light, sharp eyes and hair, white die-cut sticker border, clean pure white background.
If the user additional instruction requests another style such as 3D chibi / Pixar-like / cartoon, follow that style instead at high quality.
Create one sticker sheet with 16 diverse everyday expressions in an even 4-column by 4-row grid, identical sizes, consistent margins, no overlaps.
Add one short cute Vietnamese caption with correct diacritics on each sticker.
Moments/captions: “Xin chào!”, “Haha!”, “Cảm ơn nha!”, “Đồng ý!”, “Đợi mình với!”, “Đang suy nghĩ...”, “Wow!”, “Không nha!”, “Yêu bạn!”, “Nhớ bạn!”, “Mệt quá!”, “Giúp mình với!”, “Vui quá!”, “Đói rồi!”, “Ngủ ngon nhé!”, “Hẹn gặp lại!”.$prompt$,
    updated_at = NOW()
WHERE id = 'everyday-expressions';

UPDATE sticker_cards
SET prompt = $prompt$Based on the uploaded reference photo, keep the exact same face identity in every sticker.
Default art style: photorealistic beautiful real person, natural skin, soft light, white sticker border, clean white background.
If user asks for 3D chibi / Pixar-like / cartoon, use that style instead at high quality.
Create 16 summer/beach moments in an even 4x4 grid with short cute Vietnamese captions and correct diacritics.
Captions include: “Chào buổi sáng!”, “Vui quá!”, “Nóng quá!”, “Đi biển thôi!”, “Mát ghê!”, “Uống nước dừa nào!”, “Sóng ơi chờ nhé!”, “Cười lên nào!”, “Đói bụng rồi!”, “Ngủ trưa thôi!”, “Yay!”, “Thư giãn nào!”, “Chụp tấm hình nhé!”, “Ôi nắng quá!”, “Mình ổn!”, “Hẹn gặp lại!”.$prompt$,
    updated_at = NOW()
WHERE id = 'summer-sticker-pack';

UPDATE sticker_cards
SET prompt = $prompt$Based on the uploaded reference photo, keep the exact same face identity in every sticker.
Default art style: photorealistic beautiful real person; if user requests 3D chibi / Pixar-like / cartoon, follow that instead.
16 emotion stickers, even 4x4 grid, white border, clean white background, short cute Vietnamese captions with diacritics.
Captions: “Vui quá!”, “Haha!”, “Huhu...”, “Ôi trời!”, “Ủa gì vậy?”, “Để mình nghĩ...”, “Ngại quá!”, “Tự hào ghê!”, “Yay!”, “Lo quá...”, “Bực mình rồi!”, “Buồn ngủ quá!”, “Mệt xỉu!”, “Đói rồi!”, “Yêu quá!”, “Cảm ơn nha!”.$prompt$,
    updated_at = NOW()
WHERE id = 'cute-emotions';

UPDATE sticker_cards
SET prompt = $prompt$Based on the uploaded reference photo, keep the exact same face identity in every sticker.
Default art style: photorealistic beautiful real person; override to 3D chibi / Pixar-like / cartoon when user requests it.
16 work/study moments, even 4x4 grid, white sticker border, clean white background, short cute Vietnamese captions.
Captions: “Bắt đầu thôi!”, “Học bài nào!”, “Đang ghi chép...”, “Tập trung nào!”, “Họp thôi!”, “Để mình trình bày!”, “Cho mình hỏi chút!”, “À, hiểu rồi!”, “Mình chưa hiểu...”, “Cứu mình với!”, “Cà phê không?”, “Làm thêm chút nữa...”, “Sắp deadline rồi!”, “Xong rồi nè!”, “Nghỉ giải lao thôi!”, “Buồn ngủ quá!”.$prompt$,
    updated_at = NOW()
WHERE id = 'work-study-vibes';

UPDATE sticker_cards
SET prompt = $prompt$Based on the uploaded reference photo, keep the exact same face identity in every sticker.
Default art style: photorealistic beautiful real person; override to 3D chibi / Pixar-like / cartoon when user requests it.
16 romance moments, even 4x4 grid, white sticker border, clean white background, short cute Vietnamese captions.
Captions: “Chào người thương!”, “Thả tim nè!”, “Cười với mình nhé!”, “Ngại quá đi!”, “Nhớ bạn quá!”, “Hẹn hò nhé?”, “Tặng hoa nè!”, “Quà cho bạn đây!”, “Chụt một cái!”, “Ôm cái nào!”, “Yêu bạn nhất!”, “Cảm ơn tình yêu!”, “Đừng giận nha!”, “Ghen một chút thôi!”, “Đừng buồn nhé!”, “Ngủ ngon nha!”.$prompt$,
    updated_at = NOW()
WHERE id = 'love-notes';

UPDATE sticker_cards
SET prompt = $prompt$Based on the uploaded reference photo, keep the exact same face identity in every sticker.
Default art style: photorealistic beautiful real person; override to 3D chibi / Pixar-like / cartoon when user requests it.
16 foodie moments, even 4x4 grid, white sticker border, clean white background, short cute Vietnamese captions.
Captions: “Đói bụng rồi!”, “Ăn gì đây?”, “Cho mình gọi món!”, “Đợi đồ ăn nhé!”, “Thơm quá đi!”, “Miếng đầu tiên!”, “Ngon tuyệt vời!”, “Cay nhưng ngon!”, “No căng bụng!”, “Cho thêm phần nữa!”, “Ăn chung nhé!”, “Bạn ăn miếng không?”, “Trà sữa không?”, “Tráng miệng thôi!”, “Để mình nấu!”, “Ngon xỉu luôn!”.$prompt$,
    updated_at = NOW()
WHERE id = 'foodie-moments';

UPDATE sticker_cards
SET prompt = $prompt$Based on the uploaded reference photo, keep the exact same face identity in every sticker.
Default art style: photorealistic beautiful real person; override to 3D chibi / Pixar-like / cartoon when user requests it.
16 travel moments, even 4x4 grid, white sticker border, clean white background, short cute Vietnamese captions.
Captions: “Xếp đồ thôi!”, “Bản đồ đâu rồi?”, “Lên đường nhé!”, “Chờ chuyến bay thôi!”, “Tàu chạy rồi!”, “Đến nơi rồi!”, “Chụp ảnh nào!”, “Check-in nhé!”, “Đẹp quá đi!”, “Đi dạo thôi!”, “Hình như lạc rồi...”, “Bạn ơi, đường nào?”, “Đặc sản ngon quá!”, “Mua quà nhé!”, “Mỏi chân quá!”, “Choáng ngợp luôn!”.$prompt$,
    updated_at = NOW()
WHERE id = 'travel-adventures';
