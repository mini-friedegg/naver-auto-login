const NaverLoginManager = (() => {
    class NaverLoginManager {
        constructor() {
            this.cookies = null;
        }

        startAppLogin(callback) {
            const doc = org.jsoup.Jsoup.connect(
                "https://nid.naver.com/nidlogin.login?svctype=262144"
            )
                .userAgent(
                    "Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.162 Mobile Safari/537.36"
                )
                .get();

            const appSession = doc.select("#appsession").attr("value");
            const dynamicKey = doc.select("#dynamicKey").attr("value");

            this._openApp(appSession);
            this._startPolling(appSession, dynamicKey, callback);
        }

        _openApp(appSession) {
            try {
                const sourceJson = JSON.stringify({
                    type: "scheme",
                    clientId: "",
                    callbackPage: "https://naver.com",
                });

                const schemeUrl = `nidlogin://access.naver.com?session=${appSession}&source=${encodeURIComponent(
                    sourceJson
                )}`;

                const Intent = Java.type("android.content.Intent");
                const Uri = Java.type("android.net.Uri");
                const intent = new Intent(
                    Intent.ACTION_VIEW,
                    Uri.parse(schemeUrl)
                );
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

                App.getContext().startActivity(intent);
            } catch (e) {
                throw new Error(
                    "An error occurred while opening the app\nerror: " + e
                );
            }
        }

        _startPolling(appSession, dynamicKey, callback) {
            let count = 0;

            const pollingInterval = setInterval(() => {
                if (++count > 60) {
                    clearInterval(pollingInterval);
                    callback({
                        success: false,
                        error: "로그인 시간 초과",
                        cookies: "",
                    });
                    return;
                }

                try {
                    const res = org.jsoup.Jsoup.connect(
                        `https://nid.naver.com/login/scheme.check?session=${appSession}&cnt=${count}`
                    )
                        .userAgent(
                            "Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.162 Mobile Safari/537.36"
                        )
                        .ignoreContentType(true)
                        .execute()
                        .body();

                    const status = JSON.parse(res)["auth_result"];

                    if (status === "success") {
                        clearInterval(pollingInterval);

                        const cookies = this._getCookies(
                            appSession,
                            dynamicKey
                        );
                        this.cookies = cookies;
                        callback({
                            success: true,
                            error: "",
                            cookies: cookies,
                        });
                    } else if (status === "fail") {
                        clearInterval(pollingInterval);
                        callback({
                            success: false,
                            error: "로그인에 실패하였습니다.",
                            cookies: "",
                        });
                    } else if (status === "cancel") {
                        clearInterval(pollingInterval);
                        callback({
                            success: false,
                            error: "로그인을 취소했습니다.",
                            cookies: "",
                        });
                    } else if (status !== "ready") {
                        clearInterval(pollingInterval);
                        callback({
                            success: false,
                            error: "알 수 없는 오류입니다",
                            cookies: "",
                        });
                    }
                } catch (e) {
                    clearInterval(pollingInterval);
                    callback({
                        success: false,
                        error: e.toString(),
                        cookies: "",
                    });
                }
            }, 2000);
        }

        _getCookies(appSession, dynamicKey) {
            const headers = {
                "content-type": "application/x-www-form-urlencoded",
                Referer:
                    "https://nid.naver.com/nidlogin.login?svctype=262144&url=https%3A%2F%2Fnid.naver.com%2Fmobile%2Fuser%2Fhelp%2FnaverProfile%3Flang%3Dko_KR",
            };

            const body = `localechange=&dynamicKey=${dynamicKey}&schemeuse=false&nvlong=on&sessionKey=&show_pk=true&wtoken=&svctype=262144&bvsd=&locale=ko_KR&appsession=${appSession}&url=https%3A%2F%2Fnid.naver.com%2Fmobile%2Fuser%2Fhelp%2FnaverProfile%3Flang%3Dko_KR&eccpw=&appSchemeView=true&enctp=19&next_step=true&fbOff=true&template_type=V2_MOBILE_APPSCHEME&smart_LEVEL=-1&id=&pw=&history_LENGTH=9`;

            let c = org.jsoup.Jsoup.connect(
                "https://nid.naver.com/nidlogin.appscheme.login"
            )
                .headers(headers)
                .requestBody(body)
                .ignoreContentType(true)
                .method(Packages.org.jsoup.Connection.Method.POST)
                .execute();

            return c.cookies();
        }

        getCookies() {
            return this.cookies;
        }

        isLoggedIn() {
            if (!this.cookies) return false;

            try {
                const res = org.jsoup.Jsoup.connect(
                    "https://nid.naver.com/login/reIssueCookie"
                )
                    .header(
                        "Referer",
                        "https://nid.naver.com/user2/help/myInfoV2?lang=ko_KR"
                    )
                    .cookies(this.cookies)
                    .ignoreContentType(true)
                    .ignoreHttpErrors(true)
                    .method(Packages.org.jsoup.Connection.Method.POST)
                    .execute()
                    .body();

                return res.indexOf('"result":"success"') !== -1;
            } catch (e) {
                return false;
            }
        }

        getAuthInfo() {
            if (!this.cookies)
                return {
                    success: false,
                    error: "Authentication required",
                    data: "",
                };

            try {
                const response = org.jsoup.Jsoup.connect(
                    "https://static.nid.naver.com/getLoginStatus?callback=&charset=utf-8&svc=nid&template=gnb_utf8&one_naver=0"
                )
                    .header(
                        "Referer",
                        "https://nid.naver.com/user2/help/myInfoV2?lang=ko_KR"
                    )
                    .cookies(this.cookies)
                    .ignoreContentType(true)
                    .ignoreHttpErrors(true)
                    .execute()
                    .body();

                const info = JSON.parse(response);

                if (info.loginStatus !== "Y") {
                    return {
                        success: false,
                        error: "Cookie expired",
                        data: "",
                    };
                }

                return { success: true, error: "", data: info };
            } catch (e) {
                return {
                    success: false,
                    error: "Error: " + e,
                    data: "",
                };
            }
        }
    }

    return new NaverLoginManager();
})();

module.exports = NaverLoginManager;
