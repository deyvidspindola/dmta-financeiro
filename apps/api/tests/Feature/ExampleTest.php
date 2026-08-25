<?php

it('redireciona a raiz para o SPA', function () {
    $this->get('/')->assertRedirect('/app/');
});
