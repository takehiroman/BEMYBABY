(function () {
  // DOM
  var wrapper = document.getElementById("wrapper");
  var inner = document.getElementById("inner");

  // 顔のワイヤーフレームが表示されるcanvasタグ
  var wireframe = document.getElementById("wireframe");
  var wireframeContext = wireframe.getContext("2d");

  // マスクを描画するcanvas
  var maskCanvas;

  // video
  var video = document.getElementById("video");

  // ログ表示用
  var log = document.getElementById("log");

  // マスク画像
  var maskUrl = "images/usamin.jpg";
  // マスクの頂点データ
  var maskData = [[201.95578127030882,128.13401717087103],[190.9473904794063,169.10071292358947],[187.4753794449891,213.31333594768782],[186.17974028217967,258.8185990926135],[195.43098133539422,295.7466090497122],[211.23282001738053,327.52128661110027],[233.5929343085531,353.729146069673],[264.95814170328737,368.3750252500272],[299.3348604509884,369.934155958242],[329.7606026303485,356.0680158071303],[357.7157229713398,335.1989591627432],[381.85533619167364,307.531125436364],[400.9702118862598,268.902927641039],[419.3236560933128,229.75245274373657],[429.63946525107264,188.96521538212056],[419.49764730855225,171.8301384270454],[402.28551805415975,159.0794333725129],[373.80383026166186,153.9489956744112],[349.9948079684541,153.05977607675734],[223.78181379596165,120.15122607779273],[246.00807890137494,118.23537004321338],[272.8610200333244,127.83269766425272],[293.89613697530626,138.65860839551885],[234.58538721993125,152.3400309270515],[259.2475110479014,150.33086360743738],[281.1304084155753,167.11539818083438],[254.47248375448723,165.7459540479533],[257.781934085794,156.8287179424438],[394.7901050362392,193.91087236823034],[374.9394974388976,180.25059223357937],[347.25248277643595,183.97364177341487],[370.8938460598569,195.6581054779536],[372.1874790097837,186.35145352696316],[315.18283071775545,171.7202722766644],[274.08662044154335,226.9625306022432],[263.41426720694903,242.0021951515488],[269.41229709052413,255.51865861892193],[289.6229486679885,267.562990303683],[313.48406017511206,266.85355457430296],[325.0183445625963,257.83996481161034],[323.40189935746395,239.87922881103864],[304.3819134862739,212.69822376064917],[274.77205253132524,251.2800796578807],[310.69494560214184,260.71479209103376],[246.67241804478863,287.4484703863171],[261.7099665234601,282.0484761784268],[276.0603645081235,282.659903981114],[286.3888199980348,287.52025086443626],[297.5890156875115,288.29098660043405],[311.23205306287184,294.7455872483749],[321.96393307631604,306.9065240621634],[310.0216342904066,310.0149482651591],[297.39001251999167,311.1693948956101],[281.82018615511464,309.21571436715965],[267.51474755551703,303.3467062431523],[256.88265699395447,296.29714742127396],[268.511239917607,286.8793657214486],[285.8642452736014,293.48274340590245],[304.4299973437548,296.2890686868458],[302.88802736177865,300.1297602199619],[284.2559893507318,296.4182901577181],[266.5463114297979,290.70494937612426],[293.8937765659772,252.04579925045937],[245.4933187874616,148.9491375761349],[272.5242310254736,156.500686903177],[267.84159449556,167.220194690491],[242.55386274831284,160.2370290406509],[387.2259725459506,185.69633087267067],[360.21940687836707,178.8916018368355],[358.71096973756147,190.63137672683877],[384.1221747035176,196.69036729265954]];
  // マスクを描画するクラス
  var fd;

  // Stats
  var stats;

  // clmtrackr
  var ctrack;

  //ベンダープリフィックスの有無を吸収
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

  // 処理開始
  start();

  /**
   * 処理開始
   */
  function start() {
    // Stats
    stats = new Stats();
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.dom);

    drowLog("Webカメラ読込中...");

    // MediaStream APIでWebカメラへアクセス
    navigator.getUserMedia({
        video: true,
        audio: true
      },
      function (mediaStream) {
        // videoのメタデータの取得が成功
        video.addEventListener("loadedmetadata", function (event) {
          drowLog("顔検出中...");
          // videoのサイズを取得
          var videoW = video.clientWidth;
          var videoH = video.clientHeight;

          // マスク用のcanvasを生成
          maskCanvas = document.createElement("canvas");
          maskCanvas.setAttribute("id", "mask");

          // サイズを設定
          video.width = wireframe.width = maskCanvas.width = videoW;
          video.height = wireframe.height = maskCanvas.height = videoH;

          // マスク用canvasを配置
          document.getElementById("drawArea").appendChild(maskCanvas);

          setTimeout(function () {
            // clmtrackrをインスタンス化
            ctrack = new clm.tracker();
            // 顔のモデルデータを設定
            ctrack.init(pModel);

            // マスクを描画するクラスをインスタンス化
            fd = new faceDeformer();
            // マスクを描画するcanvasを指定
            fd.init(maskCanvas);

            // マスク用画像の読み込み
            var img = document.createElement("img");
            img.onload = function () {
              // マスクの設定
              fd.load(img,maskData, pModel);
            };
            img.src = maskUrl;

            // 繰り返し処理開始
            loop();

            // 顔を検出できたときのEvent
            document.addEventListener("clmtrackrConverged", clmtrackrConvergedHandler);
            // 顔を検出できなかったときのEvent
            document.addEventListener("clmtrackrLost", clmtrackrLostHandler);
            // 顔の検出を開始
            ctrack.start(video);
          }, 1000);
        });

        // videoでWebカメラの映像を表示
        video.src = URL.createObjectURL(mediaStream);
      },
      function (error) {
        console.log("error", error);
      });
  }

  /**
   * 繰り返し処理
   */
  function loop() {
    // Stats計測開始
    stats.begin();

    // canvasの描画をクリア
    wireframeContext.clearRect(0, 0, wireframe.width, wireframe.height);

    // 座標が取得できたかどうか
    if (ctrack.getCurrentPosition()) {
      // ワイヤーフレームを描画
      ctrack.draw(wireframe);
    }

    // マスクを適応する範囲が決まってきたかどうか
    var pn = ctrack.getConvergence();
    if (pn < 0.4) {
      requestAnimationFrame(drawMaskLoop);
    } else {
      requestAnimationFrame(loop);
    }

    // Stats計測終了
    stats.end();
  }

  /**
   * マスク描画用の繰り返し処理
   */
  function drawMaskLoop() {
    // requestAnimationFrame
    requestAnimationFrame(drawMaskLoop);

    // canvasの描画をクリア
    wireframeContext.clearRect(0, 0, wireframe.width, wireframe.height);

    // 座標を取得
    var positions = ctrack.getCurrentPosition();
    if (positions) {
      // マスクを描画
      fd.draw(positions);
    }
  }

  /**
   * 顔検出失敗
   */
  function clmtrackrLostHandler() {
    // Remove Event
    document.removeEventListener("clmtrackrLost", clmtrackrLostHandler);
    document.removeEventListener("clmtrackrConverged", clmtrackrConvergedHandler);

    drowLog("顔検出失敗");
  }

  /**
   * 顔検出成功
   */
  function clmtrackrConvergedHandler() {
    // Remove Event
    document.removeEventListener("clmtrackrLost", clmtrackrLostHandler);
    document.removeEventListener("clmtrackrConverged", clmtrackrConvergedHandler);

    drowLog("顔検出成功");
  }

  /**
   * ログを表示
   * @param str
   */
  function drowLog(str) {
    log.innerHTML = str;
  }

})();