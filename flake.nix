{
  description = "Moonshot tutorial development shell";
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  outputs = { self, nixpkgs }: let system = "aarch64-darwin"; pkgs = import nixpkgs { inherit system; }; in {
    devShells.${system}.default = pkgs.mkShell { packages = [ pkgs.bun pkgs.rustup pkgs.docker-client pkgs.just ]; };
  };
}
