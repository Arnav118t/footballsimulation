def plot_huffman_tree(node, ax, x=0.5, y=1.0, dx=0.2, dy=0.1):
    if node is None:
        return
    ax.text(x, y, node.symbol if node.symbol else '', ha='center',
            bbox=dict(facecolor='white', edgecolor='black'))
    if node.left:
        ax.plot([x, x - dx], [y, y - dy], 'k-')
        plot_huffman_tree(node.left, ax, x - dx, y - dy, dx * 0.7, dy)
    if node.right:
        ax.plot([x, x + dx], [y, y - dy], 'k-')
        plot_huffman_tree(node.right, ax, x + dx, y - dy, dx * 0.7, dy)
