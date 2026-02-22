<?php
/**
 * Simple Router
 */

class Router {
    private array $routes = [];

    public function get(string $path, callable $handler): void {
        $this->addRoute('GET', $path, $handler);
    }

    public function post(string $path, callable $handler): void {
        $this->addRoute('POST', $path, $handler);
    }

    public function put(string $path, callable $handler): void {
        $this->addRoute('PUT', $path, $handler);
    }

    public function delete(string $path, callable $handler): void {
        $this->addRoute('DELETE', $path, $handler);
    }

    private function addRoute(string $method, string $path, callable $handler): void {
        // Convert route params like {id} to regex
        $pattern = preg_replace('/\{([a-zA-Z_]+)\}/', '(?P<$1>[^/]+)', $path);
        $pattern = '#^' . $pattern . '$#';
        $this->routes[] = compact('method', 'pattern', 'handler', 'path');
    }

    public function dispatch(string $method, string $uri): void {
        // Remove query string
        $uri = parse_url($uri, PHP_URL_PATH);
        // Remove /api prefix if present
        $uri = preg_replace('#^/api#', '', $uri);
        if ($uri === '' || $uri === false) $uri = '/';

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) continue;
            
            if (preg_match($route['pattern'], $uri, $matches)) {
                // Extract named params
                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
                call_user_func($route['handler'], $params);
                return;
            }
        }

        Response::json(['error' => 'Route not found'], 404);
    }
}
