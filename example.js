const NaverLoginManager = require('NaverLoginManager');

NaverLoginManager.startAppLogin((res) => {
    if (res.success) {
        Log.i("✅ 로그인 성공!");
        
        const info = NaverLoginManager.getAuthInfo();
        if (info.success) {
            Log.i("아이디: " + info.data.loginId);
            Log.i("닉네임: " + info.data.nickName);
            Log.i("이미지 URL: " + info.data.imageUrl);
        } else {
            Log.i("사용자 정보 가져오기 실패: " + info.error);
        }
    } else {
        Log.i("로그인 실패: " + res.error);
    }
});
