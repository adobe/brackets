<?php

class MyClass{
    public static $staticValue = 'static';
    const constantValue = 'const';
    public $publicValue = 'public';
    public static function staticMethod(){}
    public function publicFunction(){}
}
    
$myclass = new MyClass();

?>