<?
    function getGET ($arr) {
        $return = [];
        foreach ($arr as $key => $value) {
            array_push($return, $key . '=' . $value);
        }
        return implode('&', $return);
    }
    
    if($_GET['tunnel']) {
        // request from localhost registering a public address to a specific port
        file_put_contents('tunnel.txt', $_GET['tunnel']);
        echo 1;
    } elseif($_GET['ping']) {
        $tunnel = file_get_contents('tunnel.txt');
        $req = $tunnel . '?tunnel=' . $tunnel;
        echo $req;
        file_get_contents($req);
    } elseif($_GET) {
        // request from Fitbit, should be entirely passed along to stored tunnel
        if($_GET['code'])  { echo 'code: ' . $_GET['code'] . "\n<br>";  }
        if($_GET['token']) { echo 'token: ' . $_GET['token'] . "\n<br>"; }

        $req = file_get_contents('tunnel.txt') . '?' . getGET($_GET);
        echo $req;
        file_get_contents($req);
        // shell_exec('curl ' . $req . ' > /dev/null 2>/dev/null &');
    } else {
        echo file_get_contents('tunnel.txt');
    }

?>