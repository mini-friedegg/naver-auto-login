네이버 앱 인증을 통한 자동 로그인 모듈

## 설명

네이버 앱을 이용한 비공식 자동 로그인 모듈입니다.

웹에서 로그인 세션을 생성하고, 딥링크로 네이버 앱을 실행한 후, 사용자가 앱에서 승인하면 폴링 방식으로 인증 쿠키를 자동으로 가져옵니다.

복잡한 OAuth 없이 간단한 콜백 패턴으로 네이버 API 인증 쿠키를 획득할 수 있습니다.

## 설치

```javascript
const NaverLoginManager = require('NaverLoginManager');
```

## 사용법

### 로그인

```javascript
NaverLoginManager.startAppLogin((response) => {
    if (response.success) {
        Log.i("로그인 성공!");
    } else {
        Log.i("로그인 실패: " + response.error);
    }
});
```

### 로그인 상태 확인

```javascript
if (NaverLoginManager.isLoggedIn()) {
    Log.i("로그인됨");
}
```

### 사용자 정보 가져오기

```javascript
const authInfo = NaverLoginManager.getAuthInfo();

if (authInfo.success) {
    Log.i("아이디: " + authInfo.data.loginId);
    Log.i("닉네임: " + authInfo.data.nickName);
}
```

## API

### `startAppLogin(callback)`

로그인을 시작합니다.

**응답:**
```javascript
{
    success: true,          // 성공 여부
    error: "",              // 에러 메시지
    cookies: java.util.HashMap  // 쿠키 객체
}
```

### `isLoggedIn()`

로그인 상태를 확인합니다.

**반환:** `Boolean`

### `getAuthInfo()`

사용자 정보를 가져옵니다.

**반환:**
```javascript
{
    success: true,
    error: "",
    data: {
        loginId: "",
        loginGroupId: "",
        nickName: "",
        imageUrl: "",
        loginStatus: "",
        meCount: 0,
        talkCount: 0,
        date: "",
        membership: ""
    }
}
```

### `getCookies()`

저장된 쿠키를 반환합니다.

**반환:** `java.util.HashMap` (로그인 안 됐으면 `null`)

## 예제

자세한 사용 예제는 [example.js](./example.js)를 참고하세요.

## 요구사항

- 네이버 앱이 설치된 Android 환경
- GraalJS 엔진

## 주의사항

- 네이버 앱에서 수동으로 로그인 승인 필요
- 쿠키는 메모리에만 저장 (재시작 시 재로그인 필요)
- 최대 대기 시간: 60초
  

## 라이센스

MIT
